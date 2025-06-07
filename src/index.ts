import { words, wordsSchema, wordsInsertSchema } from "../drizzle/schema/schema";
import { OnError } from "./utils/error";
import DB, { Token } from "./api";

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

export class User extends DB {

	async list() {
		return await this.all(user);
	}

	@OnError('sign-in error')
	async sign(data: typeof user.$inferInsert) {
		const user_data = userInsertSchema.parse(data);

		const status = await this.db.insert(user).values(user_data)
			.onConflictDoNothing({target: user.email});
		
		const token = await this.token().sign(user_data);

		return {token};
	}

	async verify(token: string) {
		type User = typeof user.$inferInsert;
		return await this.token().verify(token) as JWTVerifyResult<User>;
	}
}

import {log, insertLogSchema} from "../drizzle/schema/schema"

export class Log extends DB {
	
	async add(route: string, country: string, ip: string, user?: string) {
		const log_data = insertLogSchema.parse({route, country, ip, user});
		const status = await this.db.insert(log).values(log_data);
		return status;
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

import {
	chat, chatInsertSchema,
	ch_member, memberInsertSchema,
	message, messageInsertSchema
} from "../drizzle/schema/schema";
import { eq, and } from "drizzle-orm";
import { JWTVerifyResult } from "jose";

export class Chat extends DB {

	@OnError()
	@Token()
	async create(
		email: string,
		name: string,
		description: string,
	) {
		// const ch_object = await this.insert(chat, chatInsertSchema, {name, description});
		const ch_object = chatInsertSchema.parse({
			name,
			description,
		});
		const ch_result = await this.db.insert(chat).values(ch_object);
		const mb_object = memberInsertSchema.parse({
			chat: ch_object.id,
			user: email,
			role: 'admin'
		});
		const mb_result = await this.db.insert(ch_member).values(mb_object);
		return {
			ch_result,
			mb_result
		}
	};

	@OnError()
	@Token()
	async remove(email: string, chat_id: string) {
		const member = this.getMember(email, chat_id);
		console.log("deleting -", chat_id)
		const result = await this.db.delete(chat)
			.where(eq(chat.id, chat_id))
			.returning()
		console.log(result)
		return result;
	}

	@OnError()
	@Token()
	async list(email: string, page: number = 0) {
		return await this.paginate(chat, {page})
			.innerJoin(ch_member, eq(chat.id, ch_member.chat))
			.where(eq(ch_member.user, email))
			.all();
	}

	@OnError()
	@Token()
	async send(email: string, chat_id: string, content: string) {
		const member = await this.getMember(email, chat_id);
		const ms_object = messageInsertSchema.parse({
			member: member.id,
			chat: chat_id,
			content
		})
		const result = await this.db.insert(message).values(ms_object);
		return result;
	}

	@OnError()
	@Token()
	async messages(email: string, chat_id: string, page: number = 0) {
		const member = await this.getMember(email, chat_id);
		const messages = await this.paginate(message, {page, pageSize: 20})
			.where(eq(message.chat, chat_id))
			.orderBy(message.sent)
			.all();
		return messages;
	}

	@OnError()
	@Token()
	async sign(email: string, chat_id: string, user_email: string, role: string = 'user') {
		const member = await this.getMember(email, chat_id);
		const ch_member_object = memberInsertSchema.parse({
			user: user_email,
			chat: chat_id,
			role,
		})
		const result = await this.db.insert(ch_member).values(ch_member_object);
		return result;
	}

	@OnError()
	@Token()
	async members(email: string, chat_id: string, page: number = 0) {
		const member = await this.getMember(email, chat_id);
		const ch_members = await this.paginate(ch_member, {page})
			.where(eq(ch_member.chat, chat_id))
			.innerJoin(user, eq(ch_member.user, user.email))
			.all();
		return ch_members;
	}

	private async getMember(email: string, chatId: string) {
		const result = await this.db
			.select()
			.from(ch_member)
			.where(
				and(
					eq(ch_member.user, email),
					eq(ch_member.chat, chatId)
				)
			)
			.limit(1)
			.all();
		if (result.length == 0) throw new Error('not a member');
		return result[0];
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
import { SocketUtils } from "./socket";
export {SocketUtils};

export type UserService = InstanceType<typeof User>;
export type WordsService = InstanceType<typeof Words>;
export type AuthService = InstanceType<typeof Auth>;
export type ChatService = InstanceType<typeof Chat>;
export type SocketUtilsService = InstanceType<typeof SocketUtils>;
export type LogService = InstanceType<typeof Log>;

