import { sqliteTable, AnySQLiteColumn, text, foreignKey, integer } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const user = sqliteTable("user", {
	email: text().primaryKey().notNull(),
	givenName: text("given_name").notNull(),
	familyName: text("family_name").notNull(),
	name: text().notNull(),
	picture: text().notNull(),
	sub: text().notNull(),
	added: text().default("sql`(current_timestamp)`"),
});

export const chMember = sqliteTable("ch_member", {
	id: text().primaryKey().notNull(),
	chat: text().notNull().references(() => chat.id, { onDelete: "cascade" } ),
	user: text().notNull().references(() => user.email, { onDelete: "cascade" } ),
	role: text().default("admin"),
	about: text().default(""),
	added: text().default("sql`(current_timestamp)`"),
});

export const chat = sqliteTable("chat", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	public: text().default("public"),
	description: text().default(""),
	added: text().default("sql`(current_timestamp)`"),
});

export const log = sqliteTable("log", {
	id: text().primaryKey().notNull(),
	added: text().default("sql`(current_timestamp)`"),
	route: text().notNull(),
	ip: text(),
	country: text(),
	user: text().references(() => user.email),
});

export const message = sqliteTable("message", {
	id: text().primaryKey().notNull(),
	chat: text().notNull().references(() => chat.id, { onDelete: "cascade" } ),
	member: text().notNull().references(() => chMember.id, { onDelete: "cascade" } ),
	content: text().notNull(),
	added: text().default("sql`(current_timestamp)`"),
});

export const words = sqliteTable("words", {
	id: integer().primaryKey().notNull(),
	language: text(),
	word: text().notNull(),
	added: text().default("sql`(current_timestamp)`"),
});

