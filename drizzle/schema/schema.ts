import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';

export const words = sqliteTable("words", {
	id: integer().primaryKey(),
	language: text(),
	word: text().notNull(),
	added: text().default(`CURRENT_TIMESTAMP`)
});

export const wordsSchema = createSelectSchema(words);
export const wordsInsertSchema = createInsertSchema(words);

export const user = sqliteTable('user', {
	email: text().primaryKey(),
	given_name: text().notNull(),
	family_name: text().notNull(),
	name: text().notNull(),
	picture: text().notNull(),
	sub: text().notNull(),
});

export const userInsertSchema = createInsertSchema(user);