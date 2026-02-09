import paApiFixture from '../test/fixtures/PA_API.json';
import { cleanBodyTextMarkup } from './cleanMarkup';
import {
	extractFieldFromString,
	processFingerpostJsonContent,
	processKeywords,
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
			supplier: 'PAAPI',
			status: 'success',
			categoryCodes: [
				'news',
				'news:uk',
				'politics',
				'news:scotland',
				'paCat:SCN',
			],
		});
	});
});
