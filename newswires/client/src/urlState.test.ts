import { exportedForTestingOnly } from './urlState';

const { urlToConfig, configToUrl, defaultConfig, defaultQuery } =
	exportedForTestingOnly;

function makeFakeLocation(url: string): { pathname: string; search: string } {
	const urlObject = new URL(url, 'https://example.com');
	return { pathname: urlObject.pathname, search: urlObject.search };
}

describe('urlToConfig', () => {
	it('parses querystring into config', () => {
		const url = makeFakeLocation('/feed?q=abc');
		const config = urlToConfig(url);
		expect(config).toEqual({ view: 'feed', query: { q: 'abc' } });
	});

	it('parses empty querystring into default query', () => {
		const url = makeFakeLocation('/feed');
		const config = urlToConfig(url);
		expect(config).toEqual({ view: 'feed', query: defaultQuery });
	});

	it('parses unrecognised path to default config', () => {
		const url = makeFakeLocation('/doesnt_exist_feed');
		const config = urlToConfig(url);
		expect(config).toEqual({ view: 'home', query: { q: '' } });
	});

	it('parses item path into config', () => {
		const url = makeFakeLocation('/item/123?q=abc');
		const config = urlToConfig(url);
		expect(config).toEqual({
			view: 'item',
			itemId: '123',
			query: { q: 'abc' },
		});
	});
});

describe('configToUrl', () => {
	it('converts config to querystring', () => {
		const config = { view: 'feed', query: { q: 'abc' } } as const;
		const url = configToUrl(config);
		expect(url).toBe('/feed?q=abc');
	});

	it('converts default query config to empty querystring', () => {
		const url = configToUrl({ view: 'feed', query: defaultQuery });
		expect(url).toBe('/feed');
	});

	it('converts item config to querystring', () => {
		const config = {
			view: 'item',
			itemId: '123',
			query: { q: 'abc' },
		} as const;
		const url = configToUrl(config);
		expect(url).toBe('/item/123?q=abc');
	});
});
