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

/*
	10 characters (base16): 16¹⁰ = ~1.1 trillion combinations (pretty safe for most use cases)
*/
export async function generateHashId(input: string, length = 10): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex.slice(0, length);
}