import { pandaFetch } from './panda-session.ts';

export const sendToIncopy = async (wireId: number) => {
	const response = await pandaFetch(`/api/item/${wireId}/incopy`, {
		method: 'POST',
		credentials: 'same-origin',
		mode: 'same-origin',
	});

	if (!response.ok) {
		throw new Error(
			'Failed to import wire to Incopy - please try again later and report this error if it continues',
		);
	}

	// this will be a url with custom scheme newswires://
	// which calls the Newswires mac app which is installed on editorial
	// macs, and can create a new incopy story, import the wire data (which is included
	// as an argument in the url) and display for editing.
	const importUrl = await response.text();

	window.open(importUrl);
};
