import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PDFParse } from 'pdf-parse';
import { documents, EmbeddingStatus } from "../db/schema/document.schema.js";
import { documentChunks } from "../db/schema/documentChunk.schema.js";
import { chatSessions } from "../db/schema/chatSession.schema.js";
import { and, eq } from "drizzle-orm";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class DocumentsService {

    private embeddings: OllamaEmbeddings;
    private client: S3Client;
    private textSplitter: RecursiveCharacterTextSplitter;

    constructor(
        @InjectDrizzle()
        private readonly db: NodePgDatabase
    ) {

        this.embeddings = new OllamaEmbeddings({
            model: process.env.AI_EMBBEDING_MODEL!,
            baseUrl: "http://localhost:11434",
        });

        this.client = new S3Client({
            region: "auto",
            endpoint: process.env.S3_ENPOINT,
            credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID!,
                secretAccessKey: process.env.SECRET_ACCESS_KEY!,
            },
        })

        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

    }

    private async extractPdfText(file: Express.Multer.File) {
        const parser = new PDFParse({
            data: file.buffer
        });

        try {

            const result = await parser.getText()
            const text = result.text.trim();
            return text;

        } catch (error) {
            console.error(error)
            throw new HttpException("Something went wrong while extracting PDF", HttpStatus.INTERNAL_SERVER_ERROR)
        } finally {
            await parser.destroy();
        }
    }


    private async uploadOnS3(file: Express.Multer.File, id: string) {

        const fileName = file?.originalname
        const fileExtenstion = fileName?.split(".").pop()?.toLowerCase();

        if (!fileExtenstion || !['pdf', 'doc', 'docx'].includes(fileExtenstion)) {
            throw new HttpException("Invalid file type. Only PDF, DOC and DOCX files are allowed.", HttpStatus.BAD_REQUEST);
        }

        const fileKey = `${id}/${Date.now()}.${fileExtenstion}`

        try {

            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            });

            await this.client.send(command);

            return {
                fileName: file.originalname,
                fileKey: fileKey,
            };

        } catch (error) {
            console.error(error)
            throw new HttpException("Something went wrong while uploading resume on s3", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }


    async addDocument(
        request: any,
        file: Express.Multer.File
    ) {

        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED)
        }

        if (!file) {
            throw new HttpException("Please upload your PDF document", HttpStatus.BAD_REQUEST)
        }

        const [pdfText, s3Response] = await Promise.all([
            this.extractPdfText(file),
            this.uploadOnS3(file, userId)
        ]);

        if (!pdfText) {
            throw new HttpException("Could not extract any readable text from this PDF", HttpStatus.BAD_REQUEST);
        }

        try {

            const [document] = await this.db.insert(documents).values({
                userId,
                fileName: s3Response.fileName,
                fileKey: s3Response.fileKey,
                embeddingStatus: EmbeddingStatus.PENDING,
            }).returning();

            this.processDocumentEmbedding(document.id, pdfText).catch((err) => {
                console.error(`Background embedding error for doc ${document.id}:`, err);
            });

            return {
                status: true,
                statusCode: HttpStatus.OK,
                message: "PDF uploaded successfully"
            }

        } catch (error) {
            console.error(error)
            throw new HttpException("Something went wrong while uploading document", HttpStatus.INTERNAL_SERVER_ERROR)
        }

    }


    private async processDocumentEmbedding(documentId: string, text: string) {

        try {

            const chunks = await this.textSplitter.splitText(text);

            if (chunks.length === 0) {
                throw new Error("No text chunks generated");
            }

            const vectors = await this.embeddings.embedDocuments(chunks);

            const chunkRows = chunks.map((chunk, index) => ({
                documentId,
                content: chunk,
                position: index,
                embedding: vectors[index],
            }));

            await this.db.transaction(async (tx) => {

                await tx.insert(documentChunks).values(chunkRows);

                await tx.update(documents)
                    .set({ embeddingStatus: EmbeddingStatus.READY })
                    .where(eq(documents.id, documentId));

            });

            return {
                status: true,
                statusCode: HttpStatus.OK,
                message: "PDF embbed processed successfully"
            }

        } catch (err) {

            console.error(`Failed to process embeddings for document ${documentId}:`, err);

            await this.db.update(documents)
                .set({ embeddingStatus: EmbeddingStatus.FAILED })
                .where(eq(documents.id, documentId));

            throw new HttpException("Failed to process PDF embeddings", HttpStatus.INTERNAL_SERVER_ERROR)
        }

    }


    private async getFileFromS3(fileKey: string): Promise<Buffer> {

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: fileKey,
        });

        const response = await this.client.send(command);
        const byteArray = await response.Body?.transformToByteArray();

        return Buffer.from(byteArray || []);
    }


    async retryEmbedding(request: any, documentId: string) {

        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED)
        }

        const [document] = await this.db
            .select()
            .from(documents)
            .where(
                and(
                    eq(documents.id, documentId),
                    eq(documents.userId, userId)
                )
            );

        if (!document) {
            throw new HttpException("Document not found", HttpStatus.NOT_FOUND);
        }

        if (document.embeddingStatus === EmbeddingStatus.READY) {
            throw new HttpException("Document embeddings are already generated", HttpStatus.BAD_REQUEST);
        }

        await this.db.update(documents)
            .set({ embeddingStatus: EmbeddingStatus.PENDING })
            .where(eq(documents.id, documentId));

        (async () => {
            try {
                const buffer = await this.getFileFromS3(document.fileKey);
                const parser = new PDFParse({ data: buffer });
                const result = await parser.getText();
                await parser.destroy();
                await this.processDocumentEmbedding(document.id, result.text.trim());
            } catch (error) {
                console.error("Retry failed:", error);
                await this.db.update(documents)
                    .set({ embeddingStatus: EmbeddingStatus.FAILED })
                    .where(eq(documents.id, documentId));
            }
        })();
        return {
            status: true,
            message: "Embedding retry initiated in background"
        };

    }


    async getUserDocuments(request: any) {

        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED)
        }

        const userDocuments = await this.db
            .select()
            .from(documents)
            .where(eq(documents.userId, userId));

        const documentsWithPresingedUrl = await Promise.all(
            userDocuments?.map(async (document) => {
                const command = new GetObjectCommand({
                    Bucket: process.env.S3_BUCKET,
                    Key: document.fileKey,
                });
                const presignedUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 });
                return {
                    ...document,
                    fileUrl: presignedUrl,
                };
            })
        );
        return {
            status: true,
            statusCode: HttpStatus.OK,
            message: "Documents fetched successfully",
            data: documentsWithPresingedUrl
        }

    }


    async deleteDocument(
        request: any,
        documentId: string
    ) {

        const userId = request?.user?.id;

        if (!userId) {
            throw new HttpException("User not found", HttpStatus.UNAUTHORIZED);
        }

        const document = await this.db
            .select()
            .from(documents)
            .where(eq(documents.id, documentId));

        if (!document) {
            throw new HttpException("Document not found", HttpStatus.NOT_FOUND);
        }

        try {
            const command = new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: document[0].fileKey,
            });

            await this.client.send(command);

            await this.db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));

            await this.db.delete(documents).where(eq(documents.id, documentId));

            // Clean up deleted document from user's chat sessions
            const userSessions = await this.db
                .select({ id: chatSessions.id, documentIds: chatSessions.documentIds })
                .from(chatSessions)
                .where(eq(chatSessions.userId, userId));

            for (const session of userSessions) {
                if (session.documentIds && session.documentIds.includes(documentId)) {
                    const filteredIds = session.documentIds.filter(id => id !== documentId);
                    await this.db
                        .update(chatSessions)
                        .set({ documentIds: filteredIds })
                        .where(eq(chatSessions.id, session.id));
                }
            }

            return {
                status: true,
                message: "Document deleted successfully"
            };
        } catch (error) {
            console.error(error);
            throw new HttpException("Failed to delete document", HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

}