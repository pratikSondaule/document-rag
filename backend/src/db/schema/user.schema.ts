import { relations } from "drizzle-orm/_relations";
import {
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { documents } from "./document.schema.js";

export const users = pgTable('users', {
    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    name: varchar("name")
        .notNull(),

    email: varchar("email")
        .unique()
        .notNull(),

    password: varchar("password"),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    documents: many(documents),
}));

export type Users = typeof users.$inferSelect;
export type NewUsers = typeof users.$inferInsert;
