import { DEFAULT_DATE_RANGE, START_OF_TODAY } from './dateConstants.ts';
import {
	isValidDateValue,
	relativeDateRangeToAbsoluteDateRange,
} from './dateHelpers.ts';
import type { Config, Query } from './sharedTypes';

export const defaultQuery: Query = {
	q: '',
	supplier: [],
	supplierExcl: [],
	keywords: undefined,
	keywordsExcl: undefined,
	bucket: undefined,
	categoryCode: [],
	categoryCodeExcl: [],
	dateRange: {
		start: DEFAULT_DATE_RANGE.start,
		end: DEFAULT_DATE_RANGE.end,
	},
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

	const startParam = urlSearchParams.get('start');
	const start =
		!!startParam && isValidDateValue(startParam)
			? startParam
			: DEFAULT_DATE_RANGE.start;

	const endParam = urlSearchParams.get('end');
	const end =
		!!endParam && isValidDateValue(endParam)
			? endParam
			: DEFAULT_DATE_RANGE.end;

	const supplier = urlSearchParams.getAll('supplier');
	const supplierExcl = urlSearchParams.getAll('supplierExcl');
	const keywords = urlSearchParams.get('keywords') ?? undefined;
	const keywordsExcl = urlSearchParams.get('keywordsExcl') ?? undefined;
	const categoryCode = urlSearchParams.getAll('categoryCode');
	const categoryCodeExcl = urlSearchParams.getAll('categoryCodeExcl');
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
		categoryCode,
		categoryCodeExcl,
		bucket,
		dateRange: { start, end },
	};

	if (page === 'feed') {
		return { view: 'feed', query };
	} else if (page.startsWith('item/') && page.split('/').length === 2) {
		return { view: 'item', itemId: page.split('/')[1], query };
	} else {
		console.log(`Page not found: "${page}", so using defaultConfig`);
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

const processDateRange = (
	config: Query,
	useAbsoluteDateTimeValues: boolean,
) => {
	if (useAbsoluteDateTimeValues) {
		// Convert relative dates to ISO-formatted absolute UTC dates, as required by the backend API.
		if (config.dateRange) {
			const [maybeStartMoment, maybeEndMoment] =
				relativeDateRangeToAbsoluteDateRange({
					start: config.dateRange.start,
					end: config.dateRange.end,
				});

			return {
				...config,
				start: maybeStartMoment?.toISOString(),
				end: maybeEndMoment?.toISOString(),
			};
		} else {
			return { ...config, start: START_OF_TODAY.toISOString() };
		}
	} else {
		return {
			...config,
			start: config.dateRange?.start,
			end:
				config.dateRange?.end && config.dateRange.end !== DEFAULT_DATE_RANGE.end
					? config.dateRange.end
					: undefined,
		};
	}
};

export const paramsToQuerystring = (
	config: Query,
	useDateTimeValue: boolean = false,
	{
		sinceId,
		beforeId,
	}: {
		sinceId?: string;
		beforeId?: string;
	} = {},
): string => {
	const flattenedQuery = processDateRange(config, useDateTimeValue);

	const params = Object.entries(flattenedQuery).reduce<Array<[string, string]>>(
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
