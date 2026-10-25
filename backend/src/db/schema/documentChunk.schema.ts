import {
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
    vector
} from "drizzle-orm/pg-core";
import { documents } from "./document.schema.js";
import { embeddingDimensions } from "../../constants/embedding.constants.js";
import { relations } from "drizzle-orm/_relations";

export const documentChunks = pgTable('document_chunks', {
    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    documentId: uuid('document_id')
        .notNull()
        .references(() => documents.id, { onDelete: "cascade" }),

    content: text("content")
        .notNull(),

    position: integer("position")
        .notNull()
        .default(0),

    embedding: vector("embedding", { dimensions: embeddingDimensions })
        .notNull(),

    createdAt: timestamp('created_at')
        .defaultNow()
        .notNull(),

    updatedAt: timestamp('updated_at')
        .$onUpdate(() => new Date())
}, (table) => [
    index("document_chunks_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
    index("document_chunks_document_id_idx").on(table.documentId),
]);

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
    document: one(documents, {
        fields: [documentChunks.documentId],
        references: [documents.id]
    })
}))

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;