import { text, SQLiteColumn } from "drizzle-orm/sqlite-core";
import { createSelectSchema, createSchemaFactory } from 'drizzle-zod';
import { sql } from "drizzle-orm";


export const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
	coerce: {
	  date: true,
	}
});

export const defaults = {
	// https://orm.drizzle.team/docs/guides/timestamp-default-value#sqlite
	current_timestamp: text().default(sql`(current_timestamp)`),
	// https://orm.drizzle.team/docs/indexes-constraints#foreign-key
	related: (table_row: SQLiteColumn) => text().notNull().references(() => table_row, {onDelete: 'cascade'})
}

export function formatDate(date: Date) {
  const isoString = date.toISOString();
  return isoString
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '');
}
