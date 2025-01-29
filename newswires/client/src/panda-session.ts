/**
 * A customised version of `fetch`, that will attempt to re-auth the user on login failure.
 */
export const pandaFetch: typeof fetch = async (...args) => {
	/* eslint-disable-next-line no-restricted-syntax -- this is the definition of 'pandaFetch' that we're asking people to use instead of fetch, but it needs to use fetch itself*/
	const response = await fetch(...args);
	if (response.status !== 419) {
		// succeeded; return the response
		return response;
	}

	// refresh the auth session
	/* eslint-disable-next-line no-restricted-syntax -- this is the definition of 'pandaFetch' that we're asking people to use instead of fetch, but it needs to use fetch itself*/
	await fetch('/', { mode: 'no-cors', credentials: 'include' });
	// reattempt the fetch, return the result no matter the expiry
	/* eslint-disable-next-line no-restricted-syntax -- this is the definition of 'pandaFetch' that we're asking people to use instead of fetch, but it needs to use fetch itself*/
	return fetch(...args);
};
