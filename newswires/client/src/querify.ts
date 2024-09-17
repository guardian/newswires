export const querify = (query: string): string => {
	if (query.trim().length <= 0) return '';
	const params = new URLSearchParams();
	params.set('q', query.trim());
	return '?' + params.toString();
};
