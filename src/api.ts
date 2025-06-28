import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { TableConfig, SQLiteTableWithColumns, SQLiteTable  } from "drizzle-orm/sqlite-core";
import { InferInsertModel } from "drizzle-orm";
import { ZodPipe } from "zod/v4";

interface Env {
	MAIN: D1Database;
	PUBLIC_GOOGLE_ID: string,
	GOOGLE_SECRET: string,
	Socket: WebSocketGateService
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

	protected insert<
		Table extends SQLiteTable,
		Schema extends ZodPipe
	>(
		table: Table,
		schema: Schema,
		rawData: any
	) {

		const object = schema.parse(rawData);
		
		const values = object as InferInsertModel<Table>;
		
		const query = this.db.insert(table).values(values)
		.then((result) => ({result, object}))
		return query
	}

	protected async all<T extends TableConfig>(source: SQLiteTableWithColumns<T>) {
		return await this.db.select().from(source).all()
	}

	protected token = () => getTokenActions({
		secret: this.env.GOOGLE_SECRET,
		expire: '2w'
	});

	protected withError<T, ARGS extends any[]>(handler: (...args: ARGS) => Promise<T>) {
		return async (...args: ARGS) => {
			try {
				return await handler(...args);
			} catch (error: any) {
				console.error(error);
				return {info: error.message}
			}
		}
	}

}

import type {WebSocketGateService, AcceptedMessage} from "../../socket/src/index";


export class EventDB extends DB {
	private socket = this.env.Socket as unknown as WebSocketGateService;

	protected event(users: [], message: AcceptedMessage) {
		this.socket.send(users, message);
	}

	protected withEvent<
		T extends AcceptedMessage['type'],                       // message type
		A extends any[],                                        // function argument types
		R extends AcceptedMessage['content']                    // resolved content type
	>(
		type: T,
		handler: (...args: A) => Promise<R>,                    // handler accepts args A, returns R
		informer: (...args: A) => Promise<string[]>             // informer accepts same args A
	): (...args: A) => Promise<R> {                            // return function accepts A, returns R
		return async (...args: A): Promise<R> => {
			console.log('calling event handler');
			const [message, receivers] = await Promise.all([
				handler(...args),
				informer(...args)
			]);

			this.socket.send(receivers, {
				type,
				content: message
			} as AcceptedMessage);

			return message;
		};
	}
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