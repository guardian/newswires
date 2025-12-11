import type { SupplierName } from '../sharedTypes';

export const headlineForComposer = (
	supplier?: SupplierName,
	headline?: string,
) => {
	if (supplier === 'UNAUTHED_EMAIL_FEED') {
		if (!headline) return undefined;
		const parts = headline.split(':');
		if (parts.length === 1) return headline;
		return parts.slice(1).join(':').trim();
	}
	return headline;
};
