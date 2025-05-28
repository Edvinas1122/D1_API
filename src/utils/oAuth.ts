type LinkParams = {
	clientId: string,
	redirectUri: string,
	scope?: string[],
	responseType?: string,
	accessType?: string,
	prompt?: string,
	state?: string
};

export function generateGoogleOAuthURL({
	clientId,
	redirectUri,
	scope = ['openid', 'email', 'profile'],
	responseType = 'code',
	accessType = 'offline',
	prompt = 'consent',
	state = ''
} : LinkParams) {
	const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
	const params = new URLSearchParams({
	  client_id: clientId,
	  redirect_uri: redirectUri,
	  response_type: responseType,
	  access_type: accessType,
	  prompt: prompt,
	  scope: scope.join(' '),
	});
  
	if (state) {
	  params.append('state', state);
	}
  
	return `${baseUrl}?${params.toString()}`;
}

import type { APIRoute, APIContext } from "astro";

/*
	generalised method to handle oauths

	getter provides us required params from astro context
*/

export function withOauth(
	getter: ( 
		context: APIContext
	) => {
		client_id: string | undefined,
		client_secret: string | undefined,
		token_path: string,
		auth_path: string,
	},
	handler: (
		context: APIContext,
		user: {sub: number, name: string, given_name: string, picture: URL, email: string},
		state: string | null
	) => Promise<Response>,
	log: (error: any, context: APIContext) => void = (error: any) => console.error(error)
): APIRoute {
	return async (context) => {

		const {client_id, client_secret, token_path, auth_path} = getter(context);
		if (!client_id || !client_secret) return response('missing google api credentials', 500);
	
		const url = new URL(context.request.url);
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');
	
		if (!code) return response('missing oauth2 code', 403)
	
	
		const this_endpoint_url = new URL(context.request.url);
		this_endpoint_url.search = '';
		this_endpoint_url.protocol = 'https'
	
		try {

			const user = await getUserOauth(
				code, client_id, client_secret, this_endpoint_url.href,
				token_path,
				auth_path
			) as {sub: number, name: string, given_name: string, picture: URL, email: string}

			return await handler(context, user, state);
		} catch (error: any) {
			log(error, context);
			return response(error.message);
		}
	}
}

async function getUserOauth(
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
	return user
}

function response(
	message: string | {},
	status: number = 400
) {
	return new Response(
		JSON.stringify({
			message
		}),
		{status}
	);
}
