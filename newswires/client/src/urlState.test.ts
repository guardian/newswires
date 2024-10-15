import { defaultQuery, exportedForTestingOnly } from './urlState';

const { urlToConfig, configToUrl, defaultConfig } = exportedForTestingOnly;

function makeFakeLocation(url: string): { pathname: string; search: string } {
	const urlObject = new URL(url, 'https://example.com');
	return { pathname: urlObject.pathname, search: urlObject.search };
}

describe('urlToConfig', () => {
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
			query: { ...defaultQuery, q: 'abc', supplier: ['AP', 'PA'] },
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
});

describe('configToUrl', () => {
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

	it('converts default query config to empty querystring', () => {
		const url = configToUrl({ view: 'feed', query: defaultQuery });
		expect(url).toBe('/feed');
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
});
