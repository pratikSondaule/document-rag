import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AskQuestionDto } from "./dto/askQuestion.dto.js";
import { chatSessions } from "../db/schema/chatSession.schema.js";
import { and, asc, cosineDistance, count, desc, eq, inArray, sql } from "drizzle-orm";
import { chatMessages, MessageRole } from "../db/schema/chatMessage.schema.js";
import { documents, EmbeddingStatus } from "../db/schema/document.schema.js";
import { documentChunks } from "../db/schema/documentChunk.schema.js";
import { querySystemPrompt } from "./prompts/querySystem.prompt.js";
import { RenameChatSessionDto } from "./dto/renameChatSession.dto.js";

@Injectable()
export class ChatsService {

    private ai: ChatOllama
    private embeddings: OllamaEmbeddings

    constructor(
        @InjectDrizzle()
        private db: NodePgDatabase
    ) {
        this.ai = new ChatOllama({
            model: "llama3.2:1b",
            baseUrl: "http://localhost:11434",
            temperature: 0,
        });

        this.embeddings = new OllamaEmbeddings({
            model: "nomic-embed-text",
            baseUrl: "http://localhost:11434",
        });
    }

    private async getOrCreateSession(
        userId: string,
        sessionId: string | undefined,
        question: string,
    ) {
        if (sessionId) {
            const [session] = await this.db
                .select({ id: chatSessions.id })
                .from(chatSessions)
                .where(
                    and(
                        eq(chatSessions.id, sessionId),
                        eq(chatSessions.userId, userId),
                    ),
                )
                .limit(1);

            if (!session) {
                throw new HttpException(
                    "Chat session not found",
                    HttpStatus.NOT_FOUND,
                );
            }

            return session.id;
        }

        const title = question.trim().length > 50
            ? `${question.trim().substring(0, 50)}...`
            : question.trim();

        const [newSession] = await this.db
            .insert(chatSessions)
            .values({ userId, title })
            .returning({ id: chatSessions.id });

        return newSession.id;
    }


    private async getReadyDocuments(
        userId: string,
        documentIds: string[],
    ) {
        if (documentIds.length === 0) {
            return { readyDocIds: [], warnings: [] };
        }

        const userDocs = await this.db
            .select({
                id: documents.id,
                fileName: documents.fileName,
                status: documents.embeddingStatus,
            })
            .from(documents)
            .where(
                and(
                    eq(documents.userId, userId),
                    inArray(documents.id, documentIds),
                ),
            );

        if (userDocs.length !== new Set(documentIds).size) {
            throw new HttpException(
                "One or more selected documents were not found for this user",
                HttpStatus.NOT_FOUND,
            );
        }

        const readyDocs = userDocs.filter(
            doc => doc.status === EmbeddingStatus.READY,
        );

        const pendingDocs = userDocs.filter(
            doc => doc.status !== EmbeddingStatus.READY,
        );

        if (readyDocs.length === 0) {
            throw new HttpException(
                "None of the selected documents are ready for querying",
                HttpStatus.BAD_REQUEST,
            );
        }

        const warnings = pendingDocs.length > 0
            ? [
                `These documents are not ready and were excluded: ${pendingDocs.map(doc => doc.fileName).join(", ")}`,
            ]
            : [];

        return {
            readyDocIds: readyDocs.map(doc => doc.id),
            warnings,
        };
    }


    private async retrieveRelevantChunks(
        userId: string,
        question: string,
        documentIds: string[],
    ) {
        const queryEmbedding = await this.embeddings.embedQuery(question);

        const similarity = sql<number>`
        1 - (${cosineDistance(documentChunks.embedding, queryEmbedding)})
    `;

        const whereConditions = [
            eq(documents.userId, userId),
            eq(documents.embeddingStatus, EmbeddingStatus.READY),
        ];

        if (documentIds.length > 0) {
            whereConditions.push(
                inArray(documentChunks.documentId, documentIds),
            );
        }

        return this.db
            .select({
                content: documentChunks.content,
                documentId: documentChunks.documentId,
                fileName: documents.fileName,
                similarity,
            })
            .from(documentChunks)
            .innerJoin(
                documents,
                eq(documentChunks.documentId, documents.id),
            )
            .where(and(...whereConditions))
            .orderBy(desc(similarity))
            .limit(5);
    }


    private async generateAnswer(
        question: string,
        relevantChunks: {
            content: string;
            fileName: string;
        }[],
    ) {
        if (relevantChunks.length === 0) {
            return "I couldn't find any relevant information in your uploaded documents to answer this question.";
        }

        const contextText = relevantChunks
            .map(
                (chunk, i) =>
                    `[Source ${i + 1}: ${chunk.fileName}]\n${chunk.content}`,
            )
            .join("\n\n");

        const prompt = querySystemPrompt(contextText, question);

        const response = await this.ai.invoke(prompt);

        return typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);
    }


    async askQuestion(request: any, data: AskQuestionDto) {

        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED)
        }

        try {

            const warnings: string[] = [];

            const sessionId = await this.getOrCreateSession(
                userId,
                data?.sessionId,
                data?.question
            );

            await this.db.insert(chatMessages).values({
                sessionId,
                role: MessageRole.USER,
                content: data?.question,
            });

            const { readyDocIds, warnings: docsWarnings } = await this.getReadyDocuments(
                userId,
                data?.documentIds || [],
            );

            warnings.push(...docsWarnings);

            const relevantChunks = await this.retrieveRelevantChunks(
                userId,
                data?.question,
                readyDocIds,
            );

            const answer = await this.generateAnswer(data?.question, relevantChunks);

            await this.db.insert(chatMessages).values({
                sessionId,
                role: MessageRole.ASSISTANT,
                content: answer,
            });

            return {
                sessionId,
                question: data?.question,
                answer,
                warnings,
            };

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            console.error(error);

            throw new HttpException(
                "Something went wrong while generating answer",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

    }


    async getChatSessions(
        request: any,
        page?: string,
        limit?: string
    ) {

        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED)
        }

        const pageNumber = page ? Number(page) : 1
        const limitNumber = limit ? Number(limit) : 10

        try {

            const [allSessions, [{ totalCount }]] = await Promise.all([
                this.db.select({
                    id: chatSessions.id,
                    title: chatSessions.title,
                    createdAt: chatSessions.createdAt,
                })
                    .from(chatSessions)
                    .where(eq(chatSessions.userId, userId))
                    .orderBy(desc(chatSessions.createdAt))
                    .limit(limitNumber)
                    .offset((pageNumber - 1) * limitNumber),

                this.db.select({ totalCount: count() })
                    .from(chatSessions)
                    .where(eq(chatSessions.userId, userId)),
            ])

            const lastPage = Math.ceil(totalCount / limitNumber)

            return {
                status: true,
                statusCode: HttpStatus.OK,
                data: allSessions,
                currentPage: pageNumber,
                hasNextPage: pageNumber < lastPage,
                hasPreviousPage: pageNumber > 1,
                lastPage: lastPage,
                totalCount: totalCount,
                message: "Fetched all chat sessions successfully"
            }

        } catch (error) {
            console.error(error);

            throw new HttpException(
                "Something went wrong while fetching chat sessions",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

    }


    async getChatHistoryBySessionId(
        request: any,
        sessionId: string,
    ) {
        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED)
        }

        const chatSession = await this.db.select()
            .from(chatSessions)
            .where(
                and(
                    eq(chatSessions.id, sessionId),
                    eq(chatSessions.userId, userId)
                )
            );

        if (!chatSession || chatSession.length === 0) {
            throw new HttpException("Chat session not found", HttpStatus.NOT_FOUND)
        }

        try {
            const chatHistory = await this.db.select({
                id: chatMessages.id,
                role: chatMessages.role,
                content: chatMessages.content,
                createdAt: chatMessages.createdAt,
            })
                .from(chatMessages)
                .where(eq(chatMessages.sessionId, sessionId))
                .orderBy(asc(chatMessages.createdAt));

            return {
                status: true,
                statusCode: HttpStatus.OK,
                data: chatHistory,
                message: "Fetched chat history successfully"
            }

        } catch (error) {
            console.error(error);

            throw new HttpException(
                "Something went wrong while fetching chat history",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    async renameChatSession(
        request: any,
        sessionId: string,
        data: RenameChatSessionDto
    ) {

        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED)
        }

        const chatSession = await this.db.select()
            .from(chatSessions)
            .where(
                and(
                    eq(chatSessions.id, sessionId),
                    eq(chatSessions.userId, userId)
                )
            );

        if (!chatSession || chatSession.length === 0) {
            throw new HttpException("Chat session not found", HttpStatus.NOT_FOUND)
        }

        try {
            const updatedSession = await this.db.update(chatSessions)
                .set({
                    title: data.title,
                })
                .where(eq(chatSessions.id, sessionId))
                .returning({
                    id: chatSessions.id,
                    title: chatSessions.title,
                });

            return {
                status: true,
                statusCode: HttpStatus.OK,
                data: updatedSession,
                message: "Chat session renamed successfully"
            }
        } catch (error) {
            console.error(error);

            throw new HttpException(
                "Something went wrong while renaming chat session",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }



    async deleteChatSession(
        request: any,
        sessionId: string,
    ) {
        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED)
        }

        const chatSession = await this.db.select()
            .from(chatSessions)
            .where(
                and(
                    eq(chatSessions.id, sessionId),
                    eq(chatSessions.userId, userId)
                )
            );

        if (!chatSession || chatSession.length === 0) {
            throw new HttpException("Chat session not found", HttpStatus.NOT_FOUND)
        }

        try {
            await this.db.delete(chatMessages)
                .where(eq(chatMessages.sessionId, sessionId));

            await this.db.delete(chatSessions)
                .where(eq(chatSessions.id, sessionId));

            return {
                status: true,
                statusCode: HttpStatus.OK,
                message: "Chat session deleted successfully"
            }
        } catch (error) {
            console.error(error);

            throw new HttpException(
                "Something went wrong while deleting chat session",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

}