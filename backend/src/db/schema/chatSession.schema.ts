import {
    pgTable,
    uuid,
    timestamp,
    varchar
} from "drizzle-orm/pg-core";
import { users } from "./user.schema.js";
import { relations } from "drizzle-orm/_relations";
import { chatMessages } from "./chatMessage.schema.js";

export const chatSessions = pgTable("chat_sessions", {

    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 255 })
        .notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())

});

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
    user: one(users, {
        fields: [chatSessions.userId],
        references: [users.id],
    }),
    messages: many(chatMessages),
}));

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;