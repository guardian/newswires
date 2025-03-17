import {processKeywords, safeBodyParse} from './handler';

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
			"body_text": "\\n \\n   <p>test paragraph 1.</p>\\n\\n<p>test paragraph 2. \\u00a0 \\n</p>\\n\\n<p>test paragraph 3.<p>"
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
});
