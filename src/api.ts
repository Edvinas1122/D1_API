import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { SQLiteTable, TableConfig, SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";

interface Env {
	MAIN: D1Database;
	PUBLIC_GOOGLE_ID: string,
	GOOGLE_SECRET: string
}

export default class DB extends WorkerEntrypoint<Env> {

	protected db = drizzle(this.env.MAIN);

	static streamToString = async (stream: ReadableStream) => {
		const chunks = [];
		for await (const chunk of stream) chunks.push(chunk);
		return Object.create(chunks).toString('utf8');
	};

	protected async all<T extends TableConfig>(source: SQLiteTableWithColumns<T>) {
		return await this.db.select().from(source).all()
	}

}