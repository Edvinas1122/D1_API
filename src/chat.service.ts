import {
	message,
	messageInsertSchema,
	ch_member,
	memberInsertSchema,
	memberUpdateSchema,
	chat,
	chatInsertSchema,
	user
} from '@schema/chat'

import { EventDB } from "./interface"

import { eq, and, desc, sql} from "drizzle-orm";

class ChatInterface extends EventDB {

	protected chat = {
		// get: async (email: string, id: string) => {
		// 	return this.db.select().from(chat)
				
		// },
		create: async (
			email: string,
			name: string,
			description: string,
		) => {
			const ch_object = await chatInsertSchema.parseAsync({
				name,
				description,
				creator: email
			})
			const result = await this.db.insert(chat).values(ch_object);
			try {
				const mb_object = await memberInsertSchema.parseAsync({
					chat: ch_object.id,
					user: email,
					role: 'admin',
				});
				const result_2 = await this.db.insert(ch_member).values(mb_object);
				return {chat:ch_object, ch_member: mb_object};
			} catch (error: any) {
				const del_result = await this.db.delete(chat).where(eq(chat.id, ch_object.id));
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
			.where(eq(chat.id, id)),
		find: async (id: string) => this.db
			.select().from(chat)
			.innerJoin(ch_member, eq(chat.id, ch_member.chat))
			.where(eq(chat.id, id))
	}

	public message = {
		list: async (
			email: string,
			chat: string,
			page: number = 0
		) => this._paginate(message, {page, pageSize: 20})
			.where(eq(message.chat, chat)),
		create: async (
			email: string,
			chat: string,
			content: string
		) => this.forMember(email, chat, async (member) => {
			
			const m_object = await messageInsertSchema.parseAsync({
				content, chat, member: member.id
			})

			const messages = await this.db
				.insert(message)
				.values(m_object)
				.returning();
			return messages[0];
		})


		// this.forMember(email, chat, async (member) => this
		// .insert(message, messageInsertSchema, {content, member: member.id, chat}))
	}

	public member = {
		list: async (email: string, chat: string, page: number = 0) => this
			._paginate(ch_member, {page})
			.innerJoin(user, eq(ch_member.user, user.email))
			.where(eq(ch_member.chat, chat))
			.all(),

		create: async (email: string, chat: string, user_email: string) => {

			const data = await memberInsertSchema.parseAsync({chat, user: user_email, role: 'invited'})
			
			const query = await this.db
				.with(this.chatMember(email, chat))
				.insert(ch_member).values(data)
				.returning();

			const created = await this.db.select().from(ch_member)
				.innerJoin(user, eq(ch_member.user, user.email))
				.where(eq(ch_member.id, query[0].id));
			
				return created;
		},
		update: async (email: string, chat_id: string, role: string) => {
			const data = memberUpdateSchema.parse({role})
			this.db
				.with(this.chatMember(email, chat_id))
				.update(ch_member).set(data)
				.where(eq(
					ch_member.id,
					this.db.select({ id: sql`chat_member.id` }).from(sql`chat_member`))
				)
		}

	}


	private chatMember = (email: string, chatId: string) => this.db.$with('chat_member')
		.as(this.db.select().from(ch_member).where(
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

	private async forMember<T>(
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
		const [members, logs] = await Promise.all([
			this.member.list(email, id, 0),
			this.socket.logs()
		])
		const Tlogs = logs as unknown as {email: string, online: boolean, last_time: number}[]

		return members.map(
			(member) => ({...member,
				online: Tlogs.find(lg => lg.email === member.user.email)?.online,
				last_seen: Tlogs.find(lg => lg.email === member.user.email)?.online
			}),
		)
	}

	async send(email: string, chat: string, content: string) {

		const message = await this.message.create(email, chat, content);

		const distribute = async () => {
			const users = await this.member.list(email, chat, 0)
				.then(users => users
					.filter(user => user.user.email !== email)
					.map(user => user.user.email)
				)
			this.event(users, {type: 'chat', content: message})
		}

		this.ctx.waitUntil(distribute());
		
		return message;
	}

	async invite(email: string, chat: string, user: string) {
		const member = (await this.member.create(email, chat, user))[0];
		
		const distribute = async () => {
			const chat = (await this.chat.find(member.ch_member.chat))[0];
			this.event([user], {type: 'invite', content: {...chat, by: email}})
		}

		this.ctx.waitUntil(distribute());

		return member;
	}

	async test() {
		this.event(['edvinasmomkus@gmail.com'], {type: 'system', content: {info: 'testing', user: 'me'}})
	}

	async accept(email: string, chat: string) {
		return this.member.update(email, chat, 'participant');
	}
}

export type ChatService = InstanceType<typeof Chat>