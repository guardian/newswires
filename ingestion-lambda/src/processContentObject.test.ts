import type { DataFormatInfo } from 'newswires-shared/index';
import paApiDataFormattingFixture from '../test/fixtures/PA_API-Data-Formatting.json';
import paApiFixture from '../test/fixtures/PA_API.json';
import { cleanBodyTextMarkup } from './cleanMarkup';
import {
	extractFieldFromString,
	processFingerpostJsonContent,
	processKeywords,
	remapSourceFeeds,
	safeBodyParse,
} from './processContentObject';

describe('processKeywords', () => {
	it('should return an empty array if provided with `undefined`', () => {
		expect(
			Array.isArray(processKeywords(undefined)) &&
				processKeywords(undefined).length === 0,
		).toBe(true);
	});

	it('should return an array of keywords if provided with a string', () => {
		expect(processKeywords('keyword1+keyword2')).toEqual([
			'keyword1',
			'keyword2',
		]);
	});

	it('should remove duplicates from the array', () => {
		expect(processKeywords('keyword1+keyword1')).toEqual(['keyword1']);
	});

	it('should handle empty strings', () => {
		expect(processKeywords('')).toEqual([]);
		expect(processKeywords('+')).toEqual([]);
	});

	it('should strip leading and trailing whitespace', () => {
		expect(processKeywords(' keyword1 + keyword2 ')).toEqual([
			'keyword1',
			'keyword2',
		]);
	});

	it('should not remove whitespace within keywords', () => {
		expect(processKeywords('keyword 1+keyword 2')).toEqual([
			'keyword 1',
			'keyword 2',
		]);
	});

	it('should handle arrays of strings, removing duplicates and empty strings', () => {
		expect(processKeywords(['keyword1', 'keyword2', 'keyword1', ''])).toEqual([
			'keyword1',
			'keyword2',
		]);
	});
});

describe('safeBodyParse', () => {
	it('should fix over-escaped characters', () => {
		const body = `{
			"version": "1",
			"firstVersion": "2025-03-13T15:45:04.000Z",
			"versionCreated": "2025-03-13T15:45:04.000Z",
			"keywords": "keyword1+keyword2",
			"body_text": "\\n \\n  <p>test paragraph 1.</p>\\n\\n<p>test paragraph 2. \\u00a0 \\n</p>\\n\\n<p>test paragraph 3.<p>"
		}`;

		expect(safeBodyParse(body)).toEqual({
			firstVersion: '2025-03-13T15:45:04.000Z',
			imageIds: [],
			keywords: ['keyword1', 'keyword2'],
			body_text:
				'<br /><p>test paragraph 1.</p><br /><p>test paragraph 2.   <br /></p><br /><p>test paragraph 3.<p>',
			version: '1',
			versionCreated: '2025-03-13T15:45:04.000Z',
		});
	});

	it('should fix incorrectly escaped curly quotes in json strings', () => {
		const body = `{
			"version": "1",
			"firstVersion": "2025-03-13T15:45:04.000Z",
			"versionCreated": "2025-03-13T15:45:04.000Z",
			"keywords": "keyword1+keyword2",
			"body_text": "bla \\“bla bla\\”."
		}`;

		expect(safeBodyParse(body)).toEqual({
			firstVersion: '2025-03-13T15:45:04.000Z',
			imageIds: [],
			keywords: ['keyword1', 'keyword2'],
			body_text: 'bla “bla bla”.',
			version: '1',
			versionCreated: '2025-03-13T15:45:04.000Z',
		});
	});

	it('should fix unescaped tab literals in json strings', () => {
		const body = `{
			"version": "1",
			"firstVersion": "2025-03-13T15:45:04.000Z",
			"versionCreated": "2025-03-13T15:45:04.000Z",
			"keywords": "keyword1+keyword2",
			"body_text": "bla	bla bla."
		}`; //             ^
		// bad char here   |
		expect(safeBodyParse(body)).toEqual({
			firstVersion: '2025-03-13T15:45:04.000Z',
			imageIds: [],
			keywords: ['keyword1', 'keyword2'],
			body_text: 'bla bla bla.', // note tab char is now space char
			version: '1',
			versionCreated: '2025-03-13T15:45:04.000Z',
		});
	});

	it('should fix unescaped newline literals in json strings', () => {
		const body = `{
			"version": "1",
			"firstVersion": "2025-03-13T15:45:04.000Z",
			"versionCreated": "2025-03-13T15:45:04.000Z",
			"keywords": "keyword1+keyword2",
			"body_text": "bla
bla
bla."
		}`;
		expect(safeBodyParse(body)).toEqual({
			firstVersion: '2025-03-13T15:45:04.000Z',
			imageIds: [],
			keywords: ['keyword1', 'keyword2'],
			body_text: 'bla bla bla.', // note newline char is now space char
			version: '1',
			versionCreated: '2025-03-13T15:45:04.000Z',
		});
	});

	it('should handle keywords in an array', () => {
		const body = `
			{
				"version": "1",
				"firstVersion": "2025-03-13T15:45:04.000Z",
				"versionCreated": "2025-03-13T15:45:04.000Z",
				"keywords": ["keyword1", "keyword2"],
				"body_text": "body"
			}`;
		expect(safeBodyParse(body)).toEqual({
			firstVersion: '2025-03-13T15:45:04.000Z',
			imageIds: [],
			keywords: ['keyword1', 'keyword2'],
			body_text: 'body',
			version: '1',
			versionCreated: '2025-03-13T15:45:04.000Z',
		});
	});
});

describe('extractFieldFromString', () => {
	it('should extract a field value from broken JSON', () => {
		const body = `{
			"slug": "test-slug",`;

		expect(extractFieldFromString(body, 'slug')).toEqual('test-slug');
	});
});

describe('processFingerpostJsonContent', () => {
	it('should process the PA API fixture correctly', () => {
		const result = processFingerpostJsonContent(JSON.stringify(paApiFixture));
		expect(result).toEqual({
			content: {
				...paApiFixture,
				body_text: cleanBodyTextMarkup(
					safeBodyParse(JSON.stringify(paApiFixture)).body_text!,
				),
				imageIds: [],
				keywords: [],
			},
			supplier: 'PA',
			guSourceFeed: 'PA_API',
			status: 'success',
			categoryCodes: [
				'paCat:SCN',
				'news',
				'news:uk',
				'politics',
				'news:scotland',
			],
		});
	});

	it('should process a PA API fixture with Data Formatting correctly', () => {
		const paApiWithDataFormatting = processFingerpostJsonContent(
			JSON.stringify(paApiDataFormattingFixture),
		);
		expect(paApiWithDataFormatting).toEqual({
			content: {
				...paApiDataFormattingFixture,
				body_text: cleanBodyTextMarkup(
					safeBodyParse(JSON.stringify(paApiDataFormattingFixture)).body_text!,
				),
				imageIds: [],
				keywords: [],
			},
			supplier: 'PA',
			guSourceFeed: 'PA_API DATA FORMATTING',
			status: 'success',
			categoryCodes: ['paCat:SFU', 'paCat:SCN'],
		});
	});
});

describe('remapSourceFeeds', () => {
	it('should return "Unknown" when sourceFeed is undefined', () => {
		expect(
			remapSourceFeeds({
				sourceFeed: undefined,
				dataFormat: undefined,
				subjectCodes: undefined,
			}),
		).toBe('Unknown');
	});

	it('should return the original sourceFeed when it is defined', () => {
		expect(
			remapSourceFeeds({
				sourceFeed: 'PA_API',
				dataFormat: undefined,
				subjectCodes: undefined,
			}),
		).toBe('PA_API');
	});

	describe('when "dataformat" is defined', () => {
		it('should return "PA_API DATA FORMATTING" when sourceFeed is "PA_API"', () => {
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA_API',
					dataFormat: {} as DataFormatInfo,
					subjectCodes: undefined,
				}),
			).toBe('PA_API DATA FORMATTING');
		});

		it('should return "PA DATA FORMATTING" when sourceFeed begins with "PA", unless it is "PA_API"', () => {
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA',
					dataFormat: {} as DataFormatInfo,
					subjectCodes: undefined,
				}),
			).toBe('PA DATA FORMATTING');
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA PA SPORT DATA',
					dataFormat: {} as DataFormatInfo,
					subjectCodes: undefined,
				}),
			).toBe('PA DATA FORMATTING');
		});

		it('should also take priority over service:EXT', () => {
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA',
					dataFormat: {} as DataFormatInfo,
					subjectCodes: ['service:EXT'],
				}),
			).toBe('PA DATA FORMATTING');
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA_API',
					dataFormat: {} as DataFormatInfo,
					subjectCodes: ['service:EXT'],
				}),
			).toBe('PA_API DATA FORMATTING');
		});
	});

	describe('when subject codes include "service:EXT"', () => {
		it('should return "PA EXT" if source feed starts with "PA"', () => {
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA',
					dataFormat: undefined,
					subjectCodes: ['service:EXT'],
				}),
			).toBe('PA EXT');
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA RACING DATA',
					dataFormat: undefined,
					subjectCodes: ['service:EXT'],
				}),
			).toBe('PA EXT');
		});

		it('unless "dataFormat" is defined, or source feed is "PA_API"', () => {
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA',
					dataFormat: {} as DataFormatInfo,
					subjectCodes: ['service:EXT'],
				}),
			).toBe('PA DATA FORMATTING');
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA_API',
					dataFormat: {} as DataFormatInfo,
					subjectCodes: ['service:EXT'],
				}),
			).toBe('PA_API DATA FORMATTING');
			expect(
				remapSourceFeeds({
					sourceFeed: 'PA_API',
					dataFormat: undefined,
					subjectCodes: ['service:EXT'],
				}),
			).toBe('PA_API');
		});
	});
});
