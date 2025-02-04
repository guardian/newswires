import { createLogger } from '../../../../shared/lambda-logging';
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

describe('apPoller', () => {
	const secret = 'test-api-key';
	const input = 'https://api.ap.org/media/v/content/feed?page=1';

	beforeEach(() => {
		jest.clearAllMocks();
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

		const result = await apPoller({ secret, input, logger });

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

		const result = await apPoller({ secret, input, logger });

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

		const result = await apPoller({ secret, input, logger });

		expect(result.payloadForIngestionLambda).toEqual([]);
		expect(result.valueForNextPoll).toBe(
			'https://api.ap.org/media/v/content/feed?page=2&include=*',
		);
	});

	it('should throw an error if the feed response contains an error', async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve({
				json: () =>
					Promise.resolve({
						error: { message: 'Some API error occurred' },
					}),
				ok: true,
			}),
		) as jest.Mock;

		await expect(apPoller({ secret, input, logger })).rejects.toThrow(
			'Some API error occurred',
		);
	});
});
