import { relations } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { createSelectSchema, createSchemaFactory } from 'drizzle-zod';
import { ZodEmail, ZodEnum, ZodString } from "zod/v4"; 

const { createInsertSchema } = createSchemaFactory({
	coerce: {
	  date: true,
	}
});

export const words = sqliteTable("words", {
	id: integer().primaryKey(),
	language: text(),
	word: text().notNull(),
	added: text().default(`CURRENT_TIMESTAMP`)
});

export const wordsSchema = createSelectSchema(words);

export const wordsInsertSchema = createInsertSchema(words, {
	word: (schema) => (schema as ZodString).max(30),
	language: (schema) => (schema as ZodString).max(30),
});

export const user = sqliteTable('user', {
	email: text().primaryKey(),
	given_name: text().notNull(),
	family_name: text().notNull(),
	name: text().notNull(),
	picture: text().notNull(),
	sub: text().notNull(),
});

export const userInsertSchema = createInsertSchema(user, {
	// email: (schema) => (schema as ZodString).email()
});


export const chat = sqliteTable('chat', {
	id: text().primaryKey(), // create hash on name and date
	created_at: integer().notNull(),
	name: text().notNull(),
	public: text().$type<"public" | "private">().default("private"), // enum
	description: text().default('')
});

export const chatInsertSchema = createInsertSchema(chat, {
	name: (schema) => (schema as ZodString).min(3).max(15),
	// created_at: (schema) => (schema as ZodString),
	// public: (schema) => (schema as ZodString),
	description: (schema) => (schema as ZodString).max(300),
})



export const ch_member = sqliteTable('ch_member', {
	id: text().primaryKey(), // create hash on user chat and date
	since: integer().notNull(),
	chat: text().notNull(), // chat_id
	user: text().notNull(), // user email
	role: text().notNull(), // ivited, blocked, admin, participant.
	about: text().default('')
});

const chatRel = relations(ch_member, ({one}) => ({
	user: one(user, {
		fields: [ch_member.user],
		references: [user.email]
	}),
	chat: one(chat, {
		fields: [ch_member.chat],
		references: [chat.id]
	})
}));

export const memberInsertSchema = createInsertSchema(ch_member);

// export const message = sqliteTable('message', {
	
// });
