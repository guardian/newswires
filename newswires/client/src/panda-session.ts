/* eslint-disable no-restricted-syntax -- this file provides the abstraction over `fetch`, so is allowed to call it directly */

/**
 * A customised version of `fetch`, that will attempt to re-auth the user on login failure.
 */
export const pandaFetch: typeof fetch = async (...args) => {
	const response = await fetch(...args);
	if (response.status !== 419) {
		// succeeded; return the response
		return response;
	}

	// refresh the auth session
	await fetch('/', { mode: 'no-cors', credentials: 'include' });
	// reattempt the fetch, return the result no matter the expiry
	return fetch(...args);
};
