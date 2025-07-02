import { buildAuthFlows, type OAuthConfig } from "./utils/oAuth";
import { EventDB } from "./interface";
import type { Env } from "./interface";


const oAuthConfig: OAuthConfig<Env> = {
	google: {
		client_id_env: 'PUBLIC_GOOGLE_ID',
		client_secret_env: 'GOOGLE_SECRET',
		token_path: 'https://oauth2.googleapis.com/token',
		auth_path: 'https://www.googleapis.com/oauth2/v3/userinfo',
	}
} 

export class Auth extends EventDB {
	private flows = buildAuthFlows(this.env, oAuthConfig)

    async fetchUser(service: keyof typeof this.flows, url: string) {
        if (!this.flows[service]) {
            throw new Error(`Unsupported auth service: ${service}`);
        }
        return await this.flows[service](new URL(url));
    }
}

export type AuthService = InstanceType<typeof Auth>;
