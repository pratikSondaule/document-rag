import {
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid
} from "drizzle-orm/pg-core";
import { chatSessions } from "./chatSession.schema.js";
import { relations } from "drizzle-orm/_relations";

export enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant",
}
export const messageRoleEnum = pgEnum("message_role", [
    MessageRole.USER,
    MessageRole.ASSISTANT,
]);

export const chatMessages = pgTable("chat_messages", {

    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    sessionId: uuid("session_id")
        .notNull()
        .references(() => chatSessions.id, { onDelete: "cascade" }),

    role: messageRoleEnum("role")
        .notNull(),

    content: text("content")
        .notNull(),

    // sources: jsonb("sources"),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
    session: one(chatSessions, {
        fields: [chatMessages.sessionId],
        references: [chatSessions.id],
    }),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
