import {
    pgEnum,
    pgTable,
    timestamp,
    uuid
} from "drizzle-orm/pg-core";
import { users } from "./user.schema.js";
import { varchar } from "drizzle-orm/cockroach-core";
import { relations } from "drizzle-orm/_relations";

export enum EmbeddingStatus {
    PENDING = "pending",
    READY = "ready",
    FAILED = "failed"
}

export const embeddingStatusEnum = pgEnum("embedding_status", [
    EmbeddingStatus.PENDING,
    EmbeddingStatus.READY,
    EmbeddingStatus.FAILED
]);

export const documents = pgTable('documents', {
    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    userId: uuid('user_id')
        .notNull()
        .references(() => users.id),

    fileName: varchar('file_name')
        .notNull(),

    fileKey: varchar('file_key')
        .notNull(),

    embeddingStatus: embeddingStatusEnum('embedding_status')
        .notNull()
        .default(EmbeddingStatus.PENDING),

    createdAt: timestamp('created_at')
        .defaultNow()
        .notNull(),

    updatedAt: timestamp('updated_at')
        .$onUpdate(() => new Date())
});

export const documentsRelations = relations(documents, ({ one }) => ({
    user: one(users, {
        fields: [documents.userId],
        references: [users.id]
    })
}))

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;