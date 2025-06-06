import DB, { Token } from "./api";
import { OnError } from "./utils/error";

export class SocketUtils extends DB {
	
	@OnError()
	async key(email: string) {
		//@ts-ignore
		const response = await this.env.Socket.token(email);
		return response;
	}
}