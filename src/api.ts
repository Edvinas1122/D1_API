import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { SQLiteTable, TableConfig, SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";

interface Env {
	MAIN: D1Database;
	PUBLIC_GOOGLE_ID: string,
	GOOGLE_SECRET: string
}

import { getTokenActions } from "./utils/jwt";

export default class DB extends WorkerEntrypoint<Env> {

	protected db = drizzle(this.env.MAIN);

	// static streamToString = async (stream: ReadableStream) => {
	// 	const chunks = [];
	// 	for await (const chunk of stream) chunks.push(chunk);
	// 	return Object.create(chunks).toString('utf8');
	// };

	protected async all<T extends TableConfig>(source: SQLiteTableWithColumns<T>) {
		return await this.db.select().from(source).all()
	}

	protected token = () => getTokenActions({
		secret: this.env.GOOGLE_SECRET,
		expire: '2w'
	});

}

/*
	with token validator email provider decorator
*/
export function Token() {
	return function <T extends DB>(
		originalMethod: <T>(this: T, email: string, ...args: any[]) => Promise<any>,
		context: ClassMethodDecoratorContext<T>
	) {
		return async function (this: DB, token: string, ...args: any[]) {
			const utils = this.token()
			const load = await utils.verify(token);

			if ("message" in load) { 
				throw new Error("Unauthorized access");
			}
			const payload = load.payload;
			if (!("email" in payload)) {
				console.error(payload);
				throw new Error("Token missing email field");
			}

			const email = payload.email as string;
			return await originalMethod.call(this, email, ...args);
		};
	};
}