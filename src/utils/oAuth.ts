type LinkParams = {
	clientId: string,
	redirectUri: string,
	scope?: string[],
	responseType?: string,
	accessType?: string,
	prompt?: string,
	state?: string
};


/*
	generalised method to handle oauths

	getter provides us required params from astro context
*/


export async function getUserOauth(
	code: string,
	client_id: string,
	client_secret: string,
	redirect_uri: string,
	tokenPath: string,
	authPath: string
) {	
	const oauthForm = new FormData();
	oauthForm.append('code', code);
	oauthForm.append('client_id', client_id);
	oauthForm.append('client_secret', client_secret);
	oauthForm.append('redirect_uri', redirect_uri);
	oauthForm.append('grant_type', 'authorization_code');

	const tokenResponse = await (await fetch(`${tokenPath}`, {
		body: oauthForm,
		method: 'POST',
	}))

	if (!tokenResponse.ok) {
		const error = await tokenResponse.text();
		throw new Error(`Failed to fetch token: ${error}`);
	}

	const token = await tokenResponse.json() as { access_token: string };

	const userInfoResponse = await fetch(`${authPath}`, {
		headers: {
			'Authorization': `Bearer ${token.access_token}`
		},
	});

	if (!userInfoResponse.ok) {
		const error = await userInfoResponse.text();
		throw new Error(`Failed to fetch user info: ${error}`);
	}
	const user = await userInfoResponse.json();
	return user as {sub: string, name: string, given_name: string, family_name: string, picture: string, email: string};
}

type AuthCreds = {
	client_id: string | undefined,
	client_secret: string | undefined,
	token_path: string,
	auth_path: string
}

export function getAuthFlowAction (
	props: AuthCreds,
	service_name: string,
) {

	function response(message: string, code: number) {
		return {message, code}
	}

	return async function authFlowAction(url: URL) {
		const {client_id, client_secret, token_path, auth_path} = props;
		if (!client_id || !client_secret) return response(`missing ${service_name} api credentials`, 500);
		
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');
	
		if (!code) return response('missing oauth2 code', 403);

		url.search = '';
		url.protocol = 'https'
		try {
			const user = await getUserOauth(code, client_id, client_secret, url.href, token_path, auth_path);
			return user;
		} catch (error: any) {
			return response(error.message, 400);
		}
	}
}

