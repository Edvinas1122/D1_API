import { Database, Interface, Event } from "./utils/database";
import { WebSocketGateService } from "@socket/index";

interface Env {
	MAIN: D1Database;
	PUBLIC_GOOGLE_ID: string,
	GOOGLE_SECRET: string,
	Socket: WebSocketGateService
}

const DB = Database<Env>((env) => [env.MAIN]);

import { AcceptedMessage } from "@socket/index";

const EventDB = Event<Env, typeof DB, AcceptedMessage>(DB, (env) => env.Socket);

export {EventDB}

// import {
// 	message,
// 	messageInsertSchema,
// 	ch_member,
// 	memberInsertSchema,
// 	chat,
// 	chatInsertSchema
// } from "@schema"

// export const ChatInterface = Interface(EventDB, {
// 	'message': {table: message, schema: messageInsertSchema},
// 	'member': {table: ch_member, schema: memberInsertSchema},
// 	'chat': {table: chat, schema: chatInsertSchema}
// });