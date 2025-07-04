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

import { Context, Handler } from 'hono'

function withQueryParams<K extends string>(
  keys: readonly K[],
  handler: (c: Context, params: Record<K, string>) => ReturnType<Handler>
): Handler {
  return (c) => {
    const params = Object.fromEntries(
    	keys.map((key) => [key, new URL(c.req.url).searchParams.get(key)])
    ) as Record<K, string | null>;

    if (Object.values(params).some((value) => value === null)) {
      return new Response('Missing required query parameter', { status: 400 });
    }

    // Cast is safe after null-check
    return handler(c, params as Record<K, string>);
  };
}

app.use('*', (c, next) => {
	c.set('chat', new Chat(c.executionCtx, c.env));
	c.set('user', new User(c.executionCtx, c.env));
	return next()
});

app.get('/', (c) => c.text('api endpoint'))

app.get('/create_and_invite', async (c) => {
	const room = await c.get('chat').create('leonlampe0@gmail.com', 'plug-bud')
	const info = await c.get('chat').invite('leonlampe0@gmail.com', room.chat?.id, 'edvinasmomkus@gmail.com');
	const message = await c.get('chat').send('leonlampe0@gmail.com', room.chat?.id, 'I am fat');
	return c.json({data: room, info})
})

app.get('/accept', 
	withQueryParams(
		['chat'],
		async (c, {chat}) => {
			c.get('chat').accept('leonlampe0@gmail.com', chat);
			return c.json({message: 'action-accept'})
		}
	)
)

app.get('/send', 
	withQueryParams(
		['content', 'chat'],
		async (c, {content, chat}) => {
			const data = await c.get('chat')
				.send('leonlampe0@gmail.com', chat, content);
			return c.json({data})
	})
)

export default app
