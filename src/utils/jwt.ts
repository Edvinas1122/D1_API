/*
	https://www.npmjs.com/package/jose
*/
import { WorkerEntrypoint } from "cloudflare:workers";
import { JWTPayload, SignJWT, jwtVerify } from "jose";

type SignReq = {
	expire?: string,
	secret: string
}

export function getTokenActions({
	expire = '2h',
	secret
}: SignReq) {
	const encoded_secret = new TextEncoder().encode(secret);

	async function sign(payload: JWTPayload) {
		const signed_token = await (new SignJWT(payload)
			.setIssuedAt()
			// .setIssuer('urn:example:issuer')
			// .setAudience('urn:example:audience')
			.setExpirationTime('2h')
			.setProtectedHeader({ alg: 'HS256' })
			.sign(encoded_secret))
		return signed_token;
	}

	async function verify(token: string) {
		try {
			const result = await jwtVerify(token, encoded_secret);
			return result;
		} catch (error: any) {
			return {message: error.message, code: 403}
		}
	}

	return {
		sign,
		verify
	}
}