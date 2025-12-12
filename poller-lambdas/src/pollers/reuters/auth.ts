import { getErrorMessage } from '@guardian/libs';
import { z } from 'zod/v4';

const AuthSchema = z.object({
	access_token: z.string(),
	expires_in: z.number(),
	token_type: z.string(),
});

const scopes =
	'https://api.thomsonreuters.com/auth/reutersconnect.contentapi.read https://api.thomsonreuters.com/auth/reutersconnect.contentapi.write';
const authUrl = 'https://auth.thomsonreuters.com/oauth/token';
const grantType = 'client_credentials';
const audience = '7a14b6a2-73b8-4ab2-a610-80fb9f40f769';

export async function auth(
	clientId: string,
	clientSecret: string,
): Promise<string> {
	const req = new Request(authUrl, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
		},
		body: `grant_type=${grantType}&client_id=${clientId}&client_secret=${clientSecret}&audience=${audience}&scope=${encodeURIComponent(scopes)}`,
	});
	try {
		console.log('Requesting new auth token from Reuters');
		const response = await fetch(req);
		const data = (await response.json()) as unknown;
		const { access_token, expires_in } = AuthSchema.parse(data);
		console.log(
			`Received new auth token from Reuters, expires in ${expires_in} seconds`,
		);
		return access_token;
	} catch (error) {
		console.error(getErrorMessage(error));
		throw new Error('Failed to get auth token from Reuters');
	}
}
