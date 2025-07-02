import {Chat, type ChatService} from "./chat.service";
import {User, Log, type UserService, type LogService} from "./user.service"
import { Auth, type AuthService } from "./auth.service";
import { SocketUtils } from "./socket.service";
export {SocketUtils};

/*
	Exporting multiple services via Named Worker Entry Point
	https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/#named-entrypoints
*/
export { Chat, User }
export type {UserService, ChatService, LogService, AuthService}
export type SocketUtilsService = InstanceType<typeof SocketUtils>;


export default {

	async fetch(
		request,
		env,
		ctx
	): Promise<Response> {

		const route = new URL(request.url).pathname;

		if (route === 'invite') {
			const params = new URL(request.url).searchParams
			const chat = new Chat(ctx, env);

			const email = params.get('email');
			const chat_name = params.get('chat');
			const user = params.get('user');

			if (!email || !chat_name || !user) throw new Response('missing search params');
			await chat.invite(email, chat_name, user);

			return await new Response('signed?')
		}

		return new Response("Hello from API", {
			status: 200,
			headers: { "Content-Type": "text/plain" },
		});
	}
} satisfies ExportedHandler<Env>
