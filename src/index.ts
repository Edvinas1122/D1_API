import { words, wordsSchema, wordsInsertSchema } from "../drizzle/schema/schema";

import API from "./api";
import { desc, asc } from "drizzle-orm";


/*
	Exporting multiple services via Named Worker Entry Point
	https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/#named-entrypoints
*/
export class Words extends API {

	async get() {
		const tables = await this.db.select().from(words).orderBy().limit(5).all();
		const validated = tables.map((word) => wordsSchema.parse(word));

		console.log(tables)
		return tables;
	}

	async post(data: typeof words.$inferInsert) {
		const item = wordsInsertSchema.parse(data);
		// @ts-ignore
		const validated = await this.db.insert(words).values(item);
		return validated;
	}

}

import { user, userInsertSchema } from "../drizzle/schema/schema";

export class User extends API {

	async list() {}

	async sign(data: typeof user.$inferInsert) {
		const item = userInsertSchema.parse(data);
		// @ts-ignore
		this.db.insert(user).values(item);
	}

	async tests() {
		return 'tests';
	}
}

import { WorkerEntrypoint } from "cloudflare:workers";
import { getAuthFlowAction } from "./utils/oAuth";

export class Auth extends WorkerEntrypoint {

	private flows = {
		google: getAuthFlowAction({
			client_id: this.env.PUBLIC_GOOGLE_ID,
			client_secret: this.env.GOOGLE_SECRET,
			token_path: 'https://oauth2.googleapis.com/token',
			auth_path: 'https://www.googleapis.com/oauth2/v3/userinfo',
		}, 'google')
	}

	async google(url: string) {
		return await this.flows.google(new URL(url));
	}
}

export default class Router {


	async fetch(
		request: Request,
	): Promise<Response> {

		const route = new URL(request.url).pathname;


		return new Response("Hello from API", {
			status: 200,
			headers: { "Content-Type": "text/plain" },
		});
	}

	async tests() {
		return 'tests';
	}
}

export type UserService = InstanceType<typeof User>;
export type WordsService = InstanceType<typeof Words>;
export type AuthService = InstanceType<typeof Auth>;



