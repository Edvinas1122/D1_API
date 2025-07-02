import {Chat, type ChatService} from "./chat.service";
import {User, Log, type UserService, type LogService} from "./user.service"
import { Auth, type AuthService } from "./auth.service";
import { SocketUtils } from "./socket.service";

/*
	Exporting multiple services via Named Worker Entry Point
	https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/#named-entrypoints
*/
export { Chat, User, Auth, Log, SocketUtils }
export type {UserService, ChatService, LogService, AuthService}
export type SocketUtilsService = InstanceType<typeof SocketUtils>;

import { Hono, MiddlewareHandler } from 'hono'
import { WorkerEntrypoint } from "cloudflare:workers";

const app = new Hono()

declare module 'hono' {
	interface ContextVariableMap {
		chat: ChatService;
		user: UserService
	}
}

app.use('*', (c, next) => {
	c.set('chat', new Chat(c.executionCtx, c.env));
	c.set('user', new User(c.executionCtx, c.env));
	return next()
});

app.get('/', (c) => c.text('api endpoint'))
app.get('/user/info', (c) => c.json(c.get('user').tableInfo('chat')))
app.get('/invite', (c) => {
	// c.get('chat').invite()
	return c.json({})
})

export default app
