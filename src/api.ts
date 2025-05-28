import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

interface Env {
	MAIN: D1Database;
}

export default class API extends WorkerEntrypoint<Env> {

	protected db = drizzle(this.env.MAIN);

	static streamToString = async (stream: ReadableStream) => {
		const chunks = [];
		for await (const chunk of stream) chunks.push(chunk);
		return Object.create(chunks).toString('utf8');
	};

}