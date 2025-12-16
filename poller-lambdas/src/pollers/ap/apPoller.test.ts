import { createLogger } from 'newswires-shared/lambda-logging';
import { apPoller } from './apPoller'; // Replace with actual path
import { apItems, apTransformedItems } from './fixtures/apItems';
import { parseNitfContent } from './parseNitfContent';

global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () =>
			Promise.resolve({
				data: {
					current_item_count: 0,
					items: [],
					next_page: 'https://api.ap.org/media/v/content/feed?page=1',
				},
			}),
		ok: true,
	}),
) as jest.Mock;

jest.mock('./parseNitfContent', () => ({
	parseNitfContent: jest.fn(),
}));

const logger = createLogger({});
const retryDelayMs = 1;

describe('apPoller', () => {
	const secret = 'test-api-key';
	const input = 'https://api.ap.org/media/v/content/feed?page=1';

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	it('should return an empty payload if no new items are in the feed', async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve({
				json: () =>
					Promise.resolve({
						data: {
							current_item_count: 0,
							items: [],
							next_page: 'https://api.ap.org/media/v/content/feed?page=2',
						},
					}),
				ok: true,
			}),
		) as jest.Mock;

		const result = await apPoller({ secret, input, logger, retryDelayMs });

		expect(result.payloadForIngestionLambda).toEqual([]);
		expect(result.valueForNextPoll).toBe(
			'https://api.ap.org/media/v/content/feed?page=2&include=*',
		);
	});

	it('should process feed items with NITF content and return payloads', async () => {
		global.fetch = jest
			.fn()
			.mockImplementationOnce(() =>
				Promise.resolve({
					json: () =>
						Promise.resolve({
							data: {
								current_item_count: 2,
								items: apItems,
								next_page: 'https://api.ap.org/media/v/content/feed?page=2',
							},
						}),
					ok: true,
				}),
			)
			.mockImplementationOnce(() =>
				Promise.resolve({
					text: () => Promise.resolve('<nitf>content1</nitf>'),
					ok: true,
				}),
			)
			.mockImplementationOnce(() =>
				Promise.resolve({
					text: () => Promise.resolve('<nitf>content2</nitf>'),
					ok: true,
				}),
			);

		(parseNitfContent as jest.Mock).mockImplementation((_xmlContent) => ({
			byline: 'Author Name',
			headline: 'Headline',
			bodyContentHtml: '<p>Body content</p>',
			abstract: 'Abstract content',
		}));

		const result = await apPoller({ secret, input, logger, retryDelayMs });

		expect(result.payloadForIngestionLambda).toHaveLength(2);
		expect(result.payloadForIngestionLambda[0]).toEqual(apTransformedItems[0]);
		expect(result.payloadForIngestionLambda[1]).toEqual(apTransformedItems[1]);
	});

	it('should exclude items without NITF renditions', async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve({
				json: () =>
					Promise.resolve({
						data: {
							current_item_count: 2,
							items: [
								{
									item: {
										altids: { etag: '123' },
										renditions: {},
									},
								},
							],
							next_page: 'https://api.ap.org/media/v/content/feed?page=2',
						},
					}),
				ok: true,
			}),
		) as jest.Mock;

		const result = await apPoller({ secret, input, logger, retryDelayMs });

		expect(result.payloadForIngestionLambda).toEqual([]);
		expect(result.valueForNextPoll).toBe(
			'https://api.ap.org/media/v/content/feed?page=2&include=*',
		);
	});

	it('should retry fetching the feed on transient errors', async () => {
		const fetchMock = global.fetch as jest.Mock;
		fetchMock
			.mockImplementationOnce(() =>
				Promise.resolve({
					json: () =>
						Promise.resolve({
							error: { message: 'Some API error occurred' },
						}),
					ok: true,
				}),
			)
			.mockImplementationOnce(() =>
				Promise.resolve({
					json: () =>
						Promise.resolve({
							data: {
								current_item_count: 0,
								items: [],
								next_page: 'https://api.ap.org/media/v/content/feed?page=1',
							},
						}),
					ok: true,
				}),
			);

		const result = await apPoller({ secret, input, logger, retryDelayMs });

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(result.payloadForIngestionLambda).toEqual([]);
		expect(result.valueForNextPoll).toBe(
			'https://api.ap.org/media/v/content/feed?page=1&include=*',
		);
	});

	it('should eventually throw an error if the fetch request throws repeatedly', async () => {
		global.fetch = jest.fn(() =>
			Promise.reject(new Error('Network error')),
		) as jest.Mock;

		await expect(
			apPoller({ secret, input, logger, retryDelayMs }),
		).rejects.toThrow('Network error');
	});

	it('should eventually throw an error if the feed response contains an error message', async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve({
				json: () =>
					Promise.resolve({
						error: { message: 'Some API error occurred' },
					}),
				ok: true,
			}),
		) as jest.Mock;

		await expect(
			apPoller({ secret, input, logger, retryDelayMs }),
		).rejects.toThrow('Some API error occurred');
	});
});
