import { getErrorMessage } from '../../../shared/getErrorMessage.ts';
import { DEFAULT_DATE_RANGE, START_OF_TODAY } from './dateConstants.ts';
import {
	isValidDateValue,
	relativeDateRangeToAbsoluteDateRange,
} from './dateHelpers.ts';
import { type Config, type Query, queryToDotcopyQuery } from './sharedTypes';

export const defaultQuery: Query = {
	q: '',
	supplier: [],
	supplierExcl: [],
	keyword: [],
	keywordExcl: [],
	preset: 'all-presets',
	categoryCode: [],
	categoryCodeExcl: [],
	dateRange: {
		start: DEFAULT_DATE_RANGE.start,
		end: DEFAULT_DATE_RANGE.end,
	},
	hasDataFormatting: undefined,
};

export const defaultConfig: Config = Object.freeze({
	query: defaultQuery,
	dotcopy: false,
	itemId: undefined,
	ticker: false,
});

function maybeStringToBooleanOrUndefined(
	value: string | null,
): boolean | undefined {
	if (value === null) {
		return undefined;
	}
	if (value === 'true') {
		return true;
	}
	if (value === 'false') {
		return false;
	}
	return undefined;
}

function searchParamsToQuery(params: URLSearchParams): Query {
	const queryString = params.get('q');

	const startParam = params.get('start');
	const start =
		!!startParam && isValidDateValue(startParam)
			? startParam
			: DEFAULT_DATE_RANGE.start;

	const endParam = params.get('end');
	const end =
		!!endParam && isValidDateValue(endParam)
			? endParam
			: DEFAULT_DATE_RANGE.end;

	const supplier = params.getAll('supplier');
	const supplierExcl = params.getAll('supplierExcl');
	const keyword = params.getAll('keyword');
	const keywordExcl = params.getAll('keywordExcl');
	const categoryCode = params.getAll('categoryCode');
	const categoryCodeExcl = params.getAll('categoryCodeExcl');
	const preset = params.get('preset') ?? 'all-presets';
	const hasDataFormatting = maybeStringToBooleanOrUndefined(
		params.get('hasDataFormatting'),
	);

	return {
		q:
			typeof queryString === 'string' || typeof queryString === 'number'
				? queryString.toString()
				: '',
		supplier,
		supplierExcl,
		keyword,
		keywordExcl,
		categoryCode,
		categoryCodeExcl,
		preset,
		dateRange: { start, end },
		hasDataFormatting,
	};
}

export function urlToConfig(location: {
	pathname: string;
	search: string;
}): Config {
	const urlSearchParams = new URLSearchParams(location.search);

	const query = searchParamsToQuery(urlSearchParams);

	/**
	 * Remove leading `/` and split by `/` to get path segments, e.g.:
	 * /                      => ['']
	 * /feed                  => ['feed']
	 * /item/12345            => ['item', '12345']
	 * /ticker/feed           => ['ticker', 'feed']
	 * /ticker/item/12345     => ['ticker', 'item', '12345']
	 */
	const segments = location.pathname.slice(1).split('/');

	const [firstSegment, ...restSegments] = segments;
	const ticker = firstSegment === 'ticker';
	const viewSegments = ticker ? restSegments : segments;

	try {
		if (viewSegments[0] === 'item' && viewSegments.length === 2) {
			return { ticker, dotcopy: false, itemId: viewSegments[1], query };
		} else if (viewSegments[0] === 'dotcopy' && viewSegments.length === 1) {
			return {
				ticker,
				dotcopy: true,
				itemId: undefined,
				query: queryToDotcopyQuery(query),
			};
		} else if (viewSegments[0] === 'dotcopy') {
			return {
				ticker,
				dotcopy: true,
				itemId: viewSegments[2],
				query: queryToDotcopyQuery(query),
			};
		} else {
			return { ticker, dotcopy: false, itemId: undefined, query };
		}
	} catch (e) {
		const errorMessage = getErrorMessage(e);
		console.error(
			`Error parsing URL to config: ${errorMessage}. Pathname: ${location.pathname}. Search: ${location.search}. Returning default config.`,
		);
		return defaultConfig;
	}
}

export const configToUrl = (config: Config): string => {
	const { dotcopy, query, itemId, ticker } = config;
	const pathName = [
		ticker ? 'ticker' : undefined,
		dotcopy ? 'dotcopy' : undefined,
		!dotcopy && !itemId ? 'feed' : undefined,
		itemId ? `item/${itemId}` : undefined,
	]
		.filter((segment) => segment !== undefined)
		.join('/');

	return `/${pathName}${paramsToQuerystring({ query, useAbsoluteDateTimeValues: false })}`;
};

const processDateRange = (query: Query, useAbsoluteDateTimeValues: boolean) => {
	if (useAbsoluteDateTimeValues) {
		// Convert relative dates to ISO-formatted absolute UTC dates, as required by the backend API.
		if (query.dateRange) {
			const [maybeStartMoment, maybeEndMoment] =
				relativeDateRangeToAbsoluteDateRange({
					start: query.dateRange.start,
					end: query.dateRange.end,
				});

			return {
				...query,
				start: maybeStartMoment?.toISOString(),
				end: maybeEndMoment?.toISOString(),
			};
		} else {
			return { ...query, start: START_OF_TODAY.toISOString() };
		}
	} else {
		return {
			...query,
			start:
				query.dateRange?.start &&
				query.dateRange.start !== DEFAULT_DATE_RANGE.start
					? query.dateRange.start
					: undefined,
			end:
				query.dateRange?.end && query.dateRange.end !== DEFAULT_DATE_RANGE.end
					? query.dateRange.end
					: undefined,
		};
	}
};

export const paramsToQuerystring = ({
	query,
	sinceId,
	beforeId,
	useAbsoluteDateTimeValues,
}: {
	query: Query;
	sinceId?: string;
	beforeId?: string;
	useAbsoluteDateTimeValues: boolean;
}): string => {
	const flattenedQuery = processDateRange(query, useAbsoluteDateTimeValues);

	const params = Object.entries(flattenedQuery).reduce<Array<[string, string]>>(
		(acc, [k, v]) => {
			if (k === 'preset' && v === defaultQuery.preset) {
				return acc;
			}
			if (typeof v === 'string' && v.trim().length > 0) {
				return [...acc, [k, v.trim()]];
			} else if (Array.isArray(v)) {
				const items: Array<[string, string]> = v
					.filter((i) => typeof i === 'string' && i.trim().length > 0)
					.map((i) => [k, i.trim()]);
				if (items.length > 0) {
					return [...acc, ...items];
				}
			} else if (typeof v === 'boolean') {
				return [...acc, [k, v.toString()]];
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
