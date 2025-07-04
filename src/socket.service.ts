import { DB } from "./interface";
import { OnError } from "./utils/error";

export class SocketUtils extends DB {
	
	@OnError()
	async key(email: string) {
		// @ts-ignore
		const response = await this.env.Socket.token(email);
		return response;
	}

	async onlineCount() {
		return await this.env.Socket.online();
	}

	
}