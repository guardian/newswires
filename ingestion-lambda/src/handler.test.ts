import { decodeBodyTextContent, processKeywords } from './handler';

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

describe('decodeBodyTextContent', () => {
	it('should fix over-escaped characters', () => {
		const content =
			'\\n \\n test paragraph 1. \\n test paragraph 2. \\u00a0 \\n test paragraph 3.';
		expect(decodeBodyTextContent(content)).toEqual(
			'<br /> <br /> test paragraph 1. <br /> test paragraph 2.   <br /> test paragraph 3.',
		);
	});
});
