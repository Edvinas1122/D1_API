import { relations } from "drizzle-orm/relations";
import { user, chMember, chat, log, message } from "./schema";

export const chMemberRelations = relations(chMember, ({one, many}) => ({
	user: one(user, {
		fields: [chMember.user],
		references: [user.email]
	}),
	chat: one(chat, {
		fields: [chMember.chat],
		references: [chat.id]
	}),
	messages: many(message),
}));

export const userRelations = relations(user, ({many}) => ({
	chMembers: many(chMember),
	logs: many(log),
}));

export const chatRelations = relations(chat, ({many}) => ({
	chMembers: many(chMember),
	messages: many(message),
}));

export const logRelations = relations(log, ({one}) => ({
	user: one(user, {
		fields: [log.user],
		references: [user.email]
	}),
}));

export const messageRelations = relations(message, ({one}) => ({
	chMember: one(chMember, {
		fields: [message.member],
		references: [chMember.id]
	}),
	chat: one(chat, {
		fields: [message.chat],
		references: [chat.id]
	}),
}));