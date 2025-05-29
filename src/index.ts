import { words, wordsSchema, wordsInsertSchema } from "../drizzle/schema/schema";
import { OnError } from "./utils/error";
import DB from "./api";

/*
	Exporting multiple services via Named Worker Entry Point
	https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/#named-entrypoints
*/

export class Words extends DB {

	@OnError()
	async get() {
		const tables = await this.db.select().from(words)
		// .limit(5)
		.all()
		const validated = tables.map((word) => wordsSchema.parse(word));

		return tables.reverse();
	}

	@OnError('word insert:', true)
	async post(data: typeof words.$inferInsert) {
		const item = wordsInsertSchema.parse(data) as typeof words.$inferInsert;

		const validated = await this.db.insert(words).values(item);
		return validated;
	}

}

import { user, userInsertSchema } from "../drizzle/schema/schema";
import { getTokenActions } from "./utils/jwt";

export class User extends DB {

	private utils = getTokenActions({
		secret: this.env.GOOGLE_SECRET,
		expire: '2w'
	});

	async list() {
		return await this.all(user);
	}

	@OnError('sign-in error')
	async sign(data: typeof user.$inferInsert) {
		const user_data = userInsertSchema.parse(data);

		const status = await this.db.insert(user).values(user_data)
			.onConflictDoNothing({target: user.email});
		
		const token = await this.utils.sign(user_data);

		return {token};
	}

	async verify(token: string) {
		return await this.utils.verify(token);
	}
}

import { getAuthFlowAction } from "./utils/oAuth";

export class Auth extends DB {
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

export default {

	async fetch(
		request: Request,
	): Promise<Response> {

		const route = new URL(request.url).pathname;

		return new Response("Hello from API", {
			status: 200,
			headers: { "Content-Type": "text/plain" },
		});
	}
}

export type UserService = InstanceType<typeof User>;
export type WordsService = InstanceType<typeof Words>;
export type AuthService = InstanceType<typeof Auth>;



