import { relations, sql } from "drizzle-orm";
import { sqliteTable, integer, text, SQLiteColumn, blob } from "drizzle-orm/sqlite-core"
import { defaults, createInsertSchema } from './defaults.util'
import { user } from "./user";


export const file = sqliteTable('file', {
    key: text('key').primaryKey(),
    link: text('link').notNull(),
    user: defaults.related(user.email),
    added: defaults.current_timestamp,
    type: text('type').notNull(),
    format: text('format').notNull(),
});

export const chatRelations = relations(file, ({one}) => ({
    user: one(user, {
        fields: [file.user],
        references: [user.email]
    }),
})) 

export const insertFileSchema = createInsertSchema(file);