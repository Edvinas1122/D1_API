import { relations, sql } from "drizzle-orm";
import { sqliteTable, integer, text, SQLiteColumn, blob } from "drizzle-orm/sqlite-core"
import { defaults, createInsertSchema } from './defaults.util'
import { ZodString } from "zod/v4";

export const user = sqliteTable('user', {
	email: text().primaryKey(),
	given_name: text().notNull(),
	family_name: text().notNull(),
	name: text().notNull(),
	picture: text().notNull(),
	sub: text().notNull(),
	added: defaults.current_timestamp
});

export const userInsertSchema = createInsertSchema(user);

/*
	Logs
*/

export const log = sqliteTable('log', {
	id: text().primaryKey(),
	date: defaults.current_timestamp,
	route: text().notNull(),
	ip: text(),
	country: text(),
	user: text().references(() => user.email)
});

export const insertLogSchema = createInsertSchema(log, {
	id: (schema) =>  (schema as ZodString).optional(),
	country: (schema) => (schema as ZodString).max(2)
})
.transform((data) => {
	const id = `${data.ip}:${Date.now()}`;
	return { ...data, id};
});