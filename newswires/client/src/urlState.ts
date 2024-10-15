import { type Config, type Query, QuerySchema } from './sharedTypes';

export const defaultQuery: Query = { q: '' };

export const defaultConfig: Config = Object.freeze({
	view: 'home',
	query: defaultQuery,
	itemId: undefined,
});

export function urlToConfig(location: {
	pathname: string;
	search: string;
}): Config {
	const page = location.pathname.slice(1);
	const urlSearchParams = Object.fromEntries(
		new URLSearchParams(location.search).entries(),
	);

	/** nb. Zod's safeParse will strip out any unknown keys, which means that
		the URL will be rewritten if it contains any unknown keys. If we decide we don't
		want this behaviour, we can use 'passthrough': https://zod.dev/?id=passthrough. */
	const queryParseResults = QuerySchema.safeParse(urlSearchParams);
	const query: Query = queryParseResults.success
		? queryParseResults.data
		: defaultQuery;

	console.log('urlToConfig', queryParseResults.data);

	if (page === 'feed') {
		return { view: 'feed', query };
	} else if (page.startsWith('item/') && page.split('/').length === 2) {
		return { view: 'item', itemId: page.split('/')[1], query };
	} else {
		console.warn(`Page not found: "${page}", so using defaultConfig`);
		return defaultConfig;
	}
}

export const configToUrl = (config: Config): string => {
	const { view, query, itemId } = config;
	switch (view) {
		case 'feed':
			return `/feed${paramsToQuerystring(query)}`;
		case 'item':
			return `/item/${itemId}${paramsToQuerystring(query)}`;
		default:
			return '/';
	}
};

export const paramsToQuerystring = (config: Query): string => {
	const params = Object.fromEntries(
		Object.entries(config).reduce<Array<[string, string]>>((acc, [k, v]) => {
			if (typeof v === 'string' && v.trim().length > 0) {
				return [...acc, [k, v.trim()]];
			} else if (Array.isArray(v) && v.length > 0) {
				return [...acc, [k, v.join(',')]];
			} else {
				return acc;
			}
		}, []),
	);
	const querystring = new URLSearchParams(params).toString();
	return querystring.length !== 0 ? `?${querystring}` : '';
};

export const exportedForTestingOnly = {
	urlToConfig,
	configToUrl,
	defaultConfig,
	defaultQuery,
};
