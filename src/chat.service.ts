import {
	message,
	messageInsertSchema,
	ch_member,
	memberInsertSchema,
	chat,
	chatInsertSchema,
	user
} from "@schema"

import { EventDB } from "./interface"

import { eq, and, desc} from "drizzle-orm";

class ChatInterface extends EventDB {

	protected chat = {
		create: async (
			email: string,
			name: string,
			description: string,
		) => {
			const ch_object = await this.insert(chat, chatInsertSchema, {
				name,
				description
			});
			try {
				const mb_object = await this.insert(ch_member, memberInsertSchema, {
					chat: ch_object.values.id,
					user: email,
					role: 'admin',
				})
				return {chat:ch_object.values, ch_member: mb_object.values};
			} catch (error: any) {
				const del_result = await this.db.delete(chat).where(eq(chat.id, ch_object.values.id));
				return {error: error.message};
			}
		},
		list: async (
			email: string,
			page: number = 0
		) => await this._paginate(chat, {page, pageSize: 20})
			.innerJoin(ch_member, eq(chat.id, ch_member.chat))
			.where(eq(ch_member.user, email))
			.all(),
		delete: async (email: string, id: string) => this.db
			.with(this.chatMember(email, id))
			.delete(chat)
			.where(eq(chat.id, id))
		// delete: async (email: string, id: string) => this.forMember(email, id, async (member) => await this.db.delete(chat).where(eq(chat.id, id)))
	}

	public message = {
		list: async (
			email: string,
			chat: string,
			page: number = 0
		) => this._paginate(message, {page, pageSize: 20})
			// .innerJoin(ch_member, eq(message.member, ch_member.id))
			.where(eq(message.chat, chat)),
		create: async (
			email: string,
			chat: string,
			content: string
		) => this.forMember(email, chat, async (member) => this
			.insert(message, messageInsertSchema, {content, member: member.id, chat}))
	}

	public member = {
		list: async (email: string, chat: string, page: number = 0) => this
			._paginate(ch_member, {page})
			.innerJoin(user, eq(ch_member.user, user.email))
			.where(eq(ch_member.chat, chat))
			.all(),
		create: async (email: string, chat: string, user: string) => this
			.insert(ch_member, memberInsertSchema, {
				chat,
				user,
				role: 'participant'
			})

	}


	private chatMember = (email: string, chatId: string) => this.db.$with('chat_admin').as(
		this.db.select().from(ch_member).where(
			and(
				eq(ch_member.user, email),
				eq(ch_member.chat, chatId)
			)
		)
	)

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

	private async forMember<T, ARGS extends any[]>(
		email: string,
		chat_id: string,
		handler: (member: Awaited<ReturnType<typeof this.getMember>>,
	) => Promise<T>) {
		const member = await this.getMember(email, chat_id);
		return await handler(member);
	}

}

export class Chat extends ChatInterface {
	async list(email: string) {
		return this.chat.list(email)
	}

	async create(email: string, name: string) {
		return await this.chat.create(email, name, '');
	}

	async delete(email: string, id: string) {
		return this.chat.delete(email, id);
	}

	async messages(email: string, id: string) {
		return this.message.list(email, id);
	}

	async members(email: string, id: string) {
		return this.member.list(email, id, 0);
	}

	async send(email: string, chat: string, content: string) {
		const sender = async () => this.message.create(email, chat, content)
				.then(result => result.values)
		const action = this.withEvent(
			'chat',
			sender,
			async () => this.member.list(email, chat, 0)
				.then(users => users
					.filter(user => user.user.email !== email)
					.map(user => user.user.email)
				)
		)
		return await action();
	}

	async sign(email: string, chat: string, user: string) {
		return this.member.create(email, chat, user);
	}
}

export type ChatService = InstanceType<typeof Chat>