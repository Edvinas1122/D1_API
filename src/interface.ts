import { Database, Event } from "./utils/database";
import { WebSocketGateService } from "@socket/index";

export interface Env {
	MAIN: D1Database;
	PUBLIC_GOOGLE_ID: string,
	GOOGLE_SECRET: string,
	Socket: WebSocketGateService
}

const DB = Database<Env>((env) => [env.MAIN, {logger: true}]);

import { AcceptedMessage } from "@socket/index";

const EventDB = Event<Env, typeof DB, AcceptedMessage, WebSocketGateService>(DB, (env) => env.Socket);

export {EventDB, DB}
