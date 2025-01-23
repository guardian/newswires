import type { Config, Query } from './sharedTypes';

export const defaultQuery: Query = {
	q: '',
	supplier: [],
	supplierExcl: [],
	keywords: undefined,
	keywordsExcl: undefined,
	subjects: undefined,
	subjectsExcl: undefined,
	bucket: undefined,
};

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

	const urlSearchParams = new URLSearchParams(location.search);
	const queryString = urlSearchParams.get('q');
	const supplier = urlSearchParams.getAll('supplier');
	const supplierExcl = urlSearchParams.getAll('supplierExcl');
	const keywords = urlSearchParams.get('keywords') ?? undefined;
	const keywordsExcl = urlSearchParams.get('keywordsExcl') ?? undefined;
	const subjects = urlSearchParams.get('subjects') ?? undefined;
	const subjectsExcl = urlSearchParams.get('subjectsExcl') ?? undefined;
	const bucket = urlSearchParams.get('bucket') ?? undefined;
	const query: Query = {
		q:
			typeof queryString === 'string' || typeof queryString === 'number'
				? queryString.toString()
				: '',
		supplier,
		supplierExcl,
		keywords,
		keywordsExcl,
		subjects,
		subjectsExcl,
		bucket,
	};

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

export const paramsToQuerystring = (
	config: Query,
	{
		sinceId,
		beforeId,
	}: {
		sinceId?: string;
		beforeId?: string;
	} = {},
): string => {
	const params = Object.entries(config).reduce<Array<[string, string]>>(
		(acc, [k, v]) => {
			if (typeof v === 'string' && v.trim().length > 0) {
				return [...acc, [k, v.trim()]];
			} else if (Array.isArray(v)) {
				const items: Array<[string, string]> = v
					.filter((i) => typeof i === 'string' && i.trim().length > 0)
					.map((i) => [k, i.trim()]);
				if (items.length > 0) {
					return [...acc, ...items];
				}
			}
			return acc;
		},
		[],
	);
	if (sinceId !== undefined) {
		params.push(['sinceId', sinceId]);
	}
	if (beforeId !== undefined) {
		params.push(['beforeId', beforeId]);
	}
	const querystring = new URLSearchParams(params).toString();
	return querystring.length !== 0 ? `?${querystring}` : '';
};

export const exportedForTestingOnly = {
	urlToConfig,
	configToUrl,
	defaultConfig,
	defaultQuery,
};
