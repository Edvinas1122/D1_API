import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { TableConfig, SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";

interface Env {
	MAIN: D1Database;
	PUBLIC_GOOGLE_ID: string,
	GOOGLE_SECRET: string,
	Socket: Service
}

import { getTokenActions } from "./utils/jwt";

export default class DB extends WorkerEntrypoint<Env> {

	protected db = drizzle(this.env.MAIN);

	protected paginate<T extends TableConfig>(
		source: SQLiteTableWithColumns<T>,
		{page, pageSize = 20}:{page: number, pageSize?: number}
	) {
		const offset = page * pageSize;
		return this.db.select().from(source)
			.limit(pageSize).offset(offset)
	}


	// async insert<
	// 	Schema extends ZodTypeAny,
	// 	Table extends SQLiteTableWithColumns<any>
	// 	>(
	// 		table: Table,
	// 		schema: Schema,
	// 		rawData: z.infer<Schema>
	// 	) {
	// 		const parsed = schema.parse(rawData);
	// 		const result = await this.db.insert(table).values(parsed);
	// 		return {result, parsed};
	// }


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