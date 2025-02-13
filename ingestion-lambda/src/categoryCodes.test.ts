import { processFingerpostAPCategoryCodes } from './categoryCodes';

describe('processFingerpostAPCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processFingerpostAPCategoryCodes([])).toEqual([]);
	});

	it('should strip out service codes', () => {
		expect(processFingerpostAPCategoryCodes(['service:news'])).toEqual([]);
	});

	it('should return simple codes labelled "iptccat" as simple "apCat" codes', () => {
		expect(
			processFingerpostAPCategoryCodes(['iptccat:a', 'iptccat:b']),
		).toEqual(['apCat:a', 'apCat:b']);
	});

	it('should expand category codes with multiple subcodes', () => {
		expect(processFingerpostAPCategoryCodes(['iptccat:c+d'])).toEqual([
			'apCat:c',
			'apCat:d',
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
		).toEqual(['apCat:a', 'apCat:c']);
	});

	it('should remove trailing and leading whitespace', () => {
		expect(
			processFingerpostAPCategoryCodes([
				'iptccat:a ',
				' iptccat:c',
				' service:news ',
				'qCode:value ',
			]),
		).toEqual(['apCat:a', 'apCat:c', 'qCode:value']);
	});

	it('should deduplicate category codes after stripping whitespace', () => {
		expect(
			processFingerpostAPCategoryCodes([
				'iptccat:a ',
				' iptccat:a',
				'iptccat:c',
			]),
		).toEqual(['apCat:a', 'apCat:c']);
	});
});
