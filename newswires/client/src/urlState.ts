import { getErrorMessage } from '@guardian/libs';
import { DEFAULT_DATE_RANGE } from './dateConstants.ts';
import { relativeDateRangeToAbsoluteDateRange } from './dateHelpers.ts';
import type { BaseQuery, EuiDateString } from './sharedTypes';
import { type Config, EuiDateStringSchema, type Query } from './sharedTypes';

export const defaultQuery: Query = {
	q: '',
	supplier: [],
	supplierExcl: [],
	keyword: [],
	keywordExcl: [],
	preset: undefined,
	categoryCode: [],
	categoryCodeExcl: [],
	guSourceFeed: [],
	guSourceFeedExcl: [],
	start: DEFAULT_DATE_RANGE.start,
	end: DEFAULT_DATE_RANGE.end,
	hasDataFormatting: undefined,
	previewPaApi: undefined,
	collectionId: undefined,
	eventCode: undefined,
};

export const defaultConfig: Config = Object.freeze({
	view: 'feed',
	query: defaultQuery,
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
	const parsedStartParam = EuiDateStringSchema.safeParse(startParam);
	const start = parsedStartParam.success
		? parsedStartParam.data
		: DEFAULT_DATE_RANGE.start;

	const endParam = params.get('end');
	const parsedEndParam = EuiDateStringSchema.safeParse(endParam);
	const end = parsedEndParam.success
		? parsedEndParam.data
		: DEFAULT_DATE_RANGE.end;

	const supplier = params.getAll('supplier');
	const supplierExcl = params.getAll('supplierExcl');
	const keyword = params.getAll('keyword');
	const keywordExcl = params.getAll('keywordExcl');
	const categoryCode = params.getAll('categoryCode');
	const categoryCodeExcl = params.getAll('categoryCodeExcl');
	const guSourceFeed = params.getAll('guSourceFeed');
	const guSourceFeedExcl = params.getAll('guSourceFeedExcl');
	const preset = params.get('preset') ?? undefined;
	const hasDataFormatting = maybeStringToBooleanOrUndefined(
		params.get('hasDataFormatting'),
	);
	const previewPaApi = maybeStringToBooleanOrUndefined(
		params.get('previewPaApi'),
	);
	const eventCode = params.get('eventCode') ?? undefined;
	let collectionId: number | undefined = undefined;

	try {
		const maybeCollectionId = params.get('collectionId');
		collectionId = maybeCollectionId ? parseInt(maybeCollectionId) : undefined;
	} catch (e) {
		const errorMessage = getErrorMessage(e);
		console.error(
			`Error parsing collectionId from URLSearchParams: ${errorMessage}. collectionId value: ${params.get(
				'collectionId',
			)}. Setting collectionId to undefined.`,
		);
		collectionId = undefined;
	}

	const baseQuery: BaseQuery = {
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
		guSourceFeed,
		guSourceFeedExcl,
		start,
		end,
		hasDataFormatting,
		previewPaApi,
		eventCode,
	};

	// we're treating preset and collectionId as mutually exclusive - if both are present, preset takes precedence and collectionId is ignored
	if (preset !== undefined) {
		return {
			...baseQuery,
			preset,
			collectionId: undefined,
		};
	} else if (collectionId !== undefined) {
		return {
			...baseQuery,
			preset: undefined,
			collectionId,
		};
	} else {
		return {
			...baseQuery,
			preset: undefined,
			collectionId: undefined,
		};
	}
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
			return { ticker, view: 'item', itemId: viewSegments[1], query };
		} else if (viewSegments[0] === 'dotcopy' && viewSegments.length === 1) {
			return { ticker, view: 'dotcopy', itemId: undefined, query };
		} else if (viewSegments[0] === 'dotcopy') {
			return { ticker, view: 'dotcopy/item', itemId: viewSegments[2], query };
		} else {
			return { ticker, view: 'feed', itemId: undefined, query };
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
	const { view, query, itemId } = config;
	switch (view) {
		case 'feed':
			return `${config.ticker ? '/ticker' : ''}/feed${paramsToQuerystring({ query, useAbsoluteDateTimeValues: false })}`;
		case 'item':
			return `${config.ticker ? '/ticker' : ''}/item/${itemId}${paramsToQuerystring({ query, useAbsoluteDateTimeValues: false })}`;
		case 'dotcopy':
			return `${config.ticker ? '/ticker' : ''}/dotcopy${paramsToQuerystring({ query, useAbsoluteDateTimeValues: false })}`;
		case 'dotcopy/item':
			return `${config.ticker ? '/ticker' : ''}/dotcopy/item/${itemId}${paramsToQuerystring({ query, useAbsoluteDateTimeValues: false })}`;
	}
};

export const processDateRange = (
	start: EuiDateString | undefined,
	end: EuiDateString | undefined,
	useAbsoluteDateTimeValues: boolean,
) => {
	if (useAbsoluteDateTimeValues) {
		// Convert relative dates to ISO-formatted absolute UTC dates, as required by the backend API.
		const maybeAbsoluteValues = relativeDateRangeToAbsoluteDateRange({
			start: start ?? DEFAULT_DATE_RANGE.start,
			end: end !== DEFAULT_DATE_RANGE.end ? end : undefined,
		});
		return {
			start: maybeAbsoluteValues.start,
			end: maybeAbsoluteValues.end,
		};
	} else {
		return {
			start: start && start !== DEFAULT_DATE_RANGE.start ? start : undefined,
			end: end && end !== DEFAULT_DATE_RANGE.end ? end : undefined,
		};
	}
};

export const paramsToQuerystring = ({
	query,
	afterTimeStamp,
	beforeTimeStamp,
	useAbsoluteDateTimeValues,
}: {
	query: Query;
	afterTimeStamp?: string;
	beforeTimeStamp?: string;
	useAbsoluteDateTimeValues: boolean;
}): string => {
	const { start, end, ...rest } = query;
	const flattenedQuery = {
		...rest,
		...processDateRange(start, end, useAbsoluteDateTimeValues),
	};

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
			} else if (typeof v === 'boolean' || typeof v === 'number') {
				return [...acc, [k, v.toString()]];
			}
			return acc;
		},
		[],
	);

	if (afterTimeStamp !== undefined) {
		params.push(['afterTimeStamp', afterTimeStamp]);
	}

	if (beforeTimeStamp !== undefined) {
		params.push(['beforeTimeStamp', beforeTimeStamp]);
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
