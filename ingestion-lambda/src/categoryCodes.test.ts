import { processFingerpostAPCategoryCodes } from './categoryCodes';

describe('processFingerpostAPCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processFingerpostAPCategoryCodes([])).toEqual([]);
	});

	it('should strip out service codes', () => {
		expect(processFingerpostAPCategoryCodes(['service:news'])).toEqual([]);
	});

	it('should return simple category codes as they were received', () => {
		expect(
			processFingerpostAPCategoryCodes(['iptccat:a', 'iptccat:b']),
		).toEqual(['iptccat:a', 'iptccat:b']);
	});

	it('should expand category codes with multiple subcodes', () => {
		expect(processFingerpostAPCategoryCodes(['iptccat:c+d'])).toEqual([
			'iptccat:c',
			'iptccat:d',
		]);
	});

	it('should pass other codes through untransformed', () => {
		expect(processFingerpostAPCategoryCodes(['qCode:value+value'])).toEqual([
			'qCode:value+value',
		]);
	});

	it('should remove empty strings', () => {
		expect(
			processFingerpostAPCategoryCodes(['iptccat:a', '', 'iptccat:c']),
		).toEqual(['iptccat:a', 'iptccat:c']);
	});

	it('should remove trailing and leading whitespace', () => {
		expect(
			processFingerpostAPCategoryCodes([
				'iptccat:a ',
				' iptccat:c',
				' service:news ',
				'qCode:value ',
			]),
		).toEqual(['iptccat:a', 'iptccat:c', 'qCode:value']);
	});

	it('should deduplicate category codes after stripping whitespace', () => {
		expect(
			processFingerpostAPCategoryCodes([
				'iptccat:a ',
				' iptccat:a',
				'iptccat:c',
			]),
		).toEqual(['iptccat:a', 'iptccat:c']);
	});
});
