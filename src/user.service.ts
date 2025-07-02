import {
	user,
	userInsertSchema,
	log,
	insertLogSchema
} from '@schema/user'
import { EventDB } from "./interface";
import { getTokenActions } from "./utils/jwt";



export class User extends EventDB {

	async list() {
		return await this._paginate(user, {page:0});
	}


	async sign(data: typeof user.$inferInsert) {
		const user_data = userInsertSchema.parse(data);
		console.log(user_data);
		const status = await this.db.insert(user).values(user_data)
			.onConflictDoNothing({target: user.email});
		
		const token = await this.token().sign(user_data);

		return {token};
	}

	async verify(token: string) {
		type User = typeof user.$inferInsert;
		return await this.token().verify(token);
	}

	protected token = () => getTokenActions({
		secret: this.env.GOOGLE_SECRET,
		expire: '2w'
	});
}

export type UserService = InstanceType<typeof User>;

export class Log extends EventDB {
	
	async add(route: string, country: string, ip: string, user?: string) {
		const log_data = insertLogSchema.parse({route, country, ip, user});
		const status = await this.db.insert(log).values(log_data);
		return status;
	}
}

export type LogService = InstanceType<typeof Log>;
