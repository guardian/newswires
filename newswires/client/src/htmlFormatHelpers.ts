import sanitizeHtml from 'sanitize-html';

export const htmlFormatBody = (bodyText: string) => {
	return sanitizeHtml(bodyText, {
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			td: ['colspan'],
		},
	});
};
