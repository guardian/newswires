import moment from 'moment';
import {
	isRelativeDateNow,
	isValidDateValue,
	relativeDateRangeToAbsoluteDateRange,
} from './dateHelpers.ts';
import { disableLogs } from './tests/testHelpers.ts';
import {
	defaultQuery,
	exportedForTestingOnly,
	paramsToQuerystring,
} from './urlState';

const { urlToConfig, configToUrl, defaultConfig } = exportedForTestingOnly;

function makeFakeLocation(url: string): { pathname: string; search: string } {
	const urlObject = new URL(url, 'https://example.com');
	return { pathname: urlObject.pathname, search: urlObject.search };
}

jest.mock('./dateHelpers', () => ({
	relativeDateRangeToAbsoluteDateRange: jest.fn(),
	isValidDateValue: jest.fn().mockReturnValue(true),
	isRelativeDateNow: jest.fn().mockReturnValue(false),
	convertToUtcDate: jest.fn().mockReturnValue(false),
}));

describe('urlToConfig', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		disableLogs();
	});

	it('parses querystring into config', () => {
		const url = makeFakeLocation('/feed?q=abc');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: { ...defaultQuery, q: 'abc' },
		});
	});

	it('parses empty querystring into default query', () => {
		const url = makeFakeLocation('/feed');
		const config = urlToConfig(url);
		expect(config).toEqual({ view: 'feed', query: defaultQuery });
	});

	it('parses unrecognised path to default config', () => {
		const url = makeFakeLocation('/doesnt_exist_feed');
		const config = urlToConfig(url);
		expect(config).toEqual(defaultConfig);
	});

	it('parses item path into config', () => {
		const url = makeFakeLocation('/item/123?q=abc&supplier=AP');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'item',
			itemId: '123',
			query: { ...defaultQuery, supplier: ['AP'], q: 'abc' },
		});
	});

	it('can handle multiple suppliers', () => {
		const url = makeFakeLocation('/feed?q=abc&supplier=AP&supplier=PA');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				supplier: ['AP', 'PA'],
			},
		});
	});

	it('defaults to using "all" suppliers', () => {
		const url = makeFakeLocation('/feed?q=abc');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: { ...defaultQuery, q: 'abc', supplier: [] },
		});
	});

	it('can exclude multiple suppliers', () => {
		const url = makeFakeLocation('/feed?q=abc&supplierExcl=PA&supplierExcl=AP');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				supplierExcl: ['PA', 'AP'],
			},
		});
	});

	it('can pass keywords', () => {
		const url = makeFakeLocation('/feed?q=abc&keywords=Sports%2CPolitics');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				keywords: 'Sports,Politics',
			},
		});
	});

	it('can exclude keywords', () => {
		const url = makeFakeLocation('/feed?q=abc&keywordsExcl=Sports%2CPolitics');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				keywordsExcl: 'Sports,Politics',
			},
		});
	});

	it('can pass categoryCode', () => {
		const url = makeFakeLocation(
			'/feed?q=abc&categoryCode=medtop%3A08000000&categoryCode=medtop%3A20001340',
		);
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				categoryCode: ['medtop:08000000', 'medtop:20001340'],
			},
		});
	});

	it('can exclude categoryCode', () => {
		const url = makeFakeLocation(
			'/feed?q=abc&categoryCodeExcl=medtop%3A08000000&categoryCodeExcl=medtop%3A20001340',
		);
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				categoryCodeExcl: ['medtop:08000000', 'medtop:20001340'],
			},
		});
	});

	it('can add a relative date range', () => {
		const url = makeFakeLocation('/feed?q=abc&start=now%2Fd&end=now%2Fd');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				dateRange: {
					start: 'now/d',
					end: 'now/d',
				},
			},
		});
	});

	it('can add an absolute date range', () => {
		const url = makeFakeLocation(
			'/feed?q=abc&start=2024-02-23T16%3A17%3A31.296Z&end=2024-02-24T16%3A17%3A36.295Z',
		);
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				dateRange: {
					end: '2024-02-24T16:17:36.295Z',
					start: '2024-02-23T16:17:31.296Z',
				},
			},
		});
	});

	it('replaces invalid dates on date math range with default value', () => {
		(isValidDateValue as unknown as jest.Mock)
			.mockReturnValueOnce(true)
			.mockReturnValueOnce(false);

		const url = makeFakeLocation('/feed?q=abc&start=now%2Fd&end=invalid');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'feed',
			query: {
				...defaultQuery,
				q: 'abc',
				dateRange: {
					start: 'now/d',
					end: 'now/d',
				},
			},
		});
	});
});

describe('configToUrl', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('converts config to querystring', () => {
		const config = {
			view: 'feed' as const,
			query: {
				q: 'abc',
				supplier: ['REUTERS' as const],
				subject: [],
			},
		};
		const url = configToUrl(config);
		expect(url).toBe('/feed?q=abc&supplier=REUTERS');
	});

	it('handle default query config', () => {
		(isRelativeDateNow as unknown as jest.Mock).mockReturnValue(true);

		const url = configToUrl({ view: 'feed', query: defaultQuery });
		expect(url).toBe('/feed?start=now%2Fd');
	});

	it('converts item config to querystring', () => {
		const config = {
			view: 'item' as const,
			itemId: '123',
			query: { q: 'abc', supplier: ['REUTERS' as const], subject: [] },
		};
		const url = configToUrl(config);
		expect(url).toBe('/item/123?q=abc&supplier=REUTERS');
	});

	it('converts relative date range to querystring', () => {
		(isRelativeDateNow as unknown as jest.Mock).mockReturnValue(false);

		const config = {
			view: 'item' as const,
			itemId: '123',
			query: {
				q: 'abc',
				supplier: ['REUTERS' as const],
				subject: [],
				dateRange: {
					start: 'now-1d/d',
					end: 'now-1d/d',
				},
			},
		};
		const url = configToUrl(config);
		expect(url).toBe(
			'/item/123?q=abc&supplier=REUTERS&start=now-1d%2Fd&end=now-1d%2Fd',
		);
	});

	it('converts config with no supplier to querystring', () => {
		const config = {
			view: 'item' as const,
			itemId: '123',
			query: { q: 'abc', supplier: [], subject: [] },
		};
		const url = configToUrl(config);
		expect(url).toBe('/item/123?q=abc');
	});

	it('converts config with many suppliers to querystring', () => {
		const config = {
			view: 'item' as const,
			itemId: '123',
			query: {
				q: 'abc',
				supplier: ['AP' as const, 'PA' as const, 'REUTERS' as const],
				subject: [],
			},
		};
		const url = configToUrl(config);
		expect(url).toBe(
			'/item/123?q=abc&supplier=AP&supplier=PA&supplier=REUTERS',
		);
	});

	it('converts config with many excluded suppliers to querystring', () => {
		const config = {
			view: 'feed' as const,
			query: { q: 'abc', supplierExcl: ['AP', 'PA', 'REUTERS'] },
		};
		const url = configToUrl(config);
		expect(url).toBe(
			'/feed?q=abc&supplierExcl=AP&supplierExcl=PA&supplierExcl=REUTERS',
		);
	});

	it('converts config with many keywords to querystring', () => {
		const config = {
			view: 'feed' as const,
			query: { q: 'abc', keywords: 'Sports,Politics' },
		};
		const url = configToUrl(config);
		expect(url).toBe('/feed?q=abc&keywords=Sports%2CPolitics');
	});

	it('converts config with many excluded keywords to querystring', () => {
		const config = {
			view: 'feed' as const,
			query: { q: 'abc', keywordsExcl: 'Sports,Politics' },
		};
		const url = configToUrl(config);
		expect(url).toBe('/feed?q=abc&keywordsExcl=Sports%2CPolitics');
	});

	it('converts config with many categoryCode to querystring', () => {
		const config = {
			view: 'feed' as const,
			query: { q: 'abc', categoryCode: ['medtop:08000000', 'medtop:20001340'] },
		};
		const url = configToUrl(config);
		expect(url).toBe(
			'/feed?q=abc&categoryCode=medtop%3A08000000&categoryCode=medtop%3A20001340',
		);
	});

	it('converts config with many excluded categoryCode to querystring', () => {
		const config = {
			view: 'feed' as const,
			query: {
				q: 'abc',
				categoryCodeExcl: ['medtop:08000000', 'medtop:20001340'],
			},
		};
		const url = configToUrl(config);
		expect(url).toBe(
			'/feed?q=abc&categoryCodeExcl=medtop%3A08000000&categoryCodeExcl=medtop%3A20001340',
		);
	});
});

describe('paramsToQuerystring', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('converts text search param to querystring', () => {
		const query = {
			q: 'abc',
		};

		const url = paramsToQuerystring(query);
		expect(url).toBe('?q=abc');
	});

	it('keep relative date range', () => {
		(relativeDateRangeToAbsoluteDateRange as jest.Mock).mockReturnValue([
			moment('2025-02-21T00:00:00.000Z'),
			moment('2025-02-21T23:59:59.000Z'),
		]);

		const query = {
			q: 'abc',
			dateRange: {
				start: 'now/d',
				end: 'now/d',
			},
		};

		const url = paramsToQuerystring(query);
		expect(url).toBe('?q=abc&start=now%2Fd');
	});

	it('converts relative date range to an absolute date range', () => {
		(relativeDateRangeToAbsoluteDateRange as jest.Mock).mockReturnValue([
			moment('2025-02-21T00:00:00.000Z'),
			moment('2025-02-21T23:59:59.000Z'),
		]);

		const query = {
			q: 'abc',
			dateRange: {
				start: 'now/d',
				end: 'now/d',
			},
		};

		const url = paramsToQuerystring(query, true);
		expect(url).toBe(
			'?q=abc&start=2025-02-21T00%3A00%3A00.000Z&end=2025-02-21T23%3A59%3A59.000Z',
		);
	});

	it('converts relative date range to a partial absolute date range', () => {
		(relativeDateRangeToAbsoluteDateRange as jest.Mock).mockReturnValue([
			moment('2025-02-21T00:00:00.000Z'),
		]);

		const query = {
			q: 'abc',
			dateRange: {
				start: 'now/d',
				end: 'now/d',
			},
		};

		const url = paramsToQuerystring(query, true);
		expect(url).toBe('?q=abc&start=2025-02-21T00%3A00%3A00.000Z');
	});
});
