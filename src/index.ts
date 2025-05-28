import { words, wordsSchema, wordsInsertSchema } from "../drizzle/schema/schema";

import API from "./api";
import { desc, asc } from "drizzle-orm";

class Words extends API {

	async getWords() {
		const tables = await this.db.select().from(words).orderBy().limit(5).all();
		const validated = tables.map((word) => wordsSchema.parse(word));

		console.log(tables)
		return tables;
	}

	async postWords(data: typeof words.$inferInsert) {
		const item = wordsInsertSchema.parse(data);
		// @ts-ignore
		const validated = await this.db.insert(words).values(item);
		return validated;
	}

}

import { user, userInsertSchema } from "../drizzle/schema/schema";

class User extends API {

	async listUsers() {}

	async signUser(data: typeof user.$inferInsert) {
		const item = userInsertSchema.parse(data);
		// @ts-ignore
		this.db.insert(user).values(item);
	}

}

export default class Router extends Words {


	async fetch(
		request: Request,
	): Promise<Response> {

		const route = new URL(request.url).pathname;

		if (route === '/words') return new Response(JSON.stringify(this.getWords()), {status: 200,headers: { "Content-Type": "text/plain" },});

		return new Response("Hello from API", {
			status: 200,
			headers: { "Content-Type": "text/plain" },
		});
	}

	async tests() {
		return 'tests';
	}
}

export type WordsRouter = InstanceType<typeof Router>;

