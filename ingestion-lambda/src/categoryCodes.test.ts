import {
	processFingerpostAAPCategoryCodes,
	processFingerpostAFPCategoryCodes,
	processFingerpostAPCategoryCodes,
} from './categoryCodes';

describe('processFingerpostAPCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processFingerpostAPCategoryCodes([])).toEqual([]);
	});

	it('should strip out service codes', () => {
		expect(processFingerpostAPCategoryCodes(['service:news'])).toEqual([]);
	});

	it('should strip out empty iptccat entries', () => {
		expect(processFingerpostAPCategoryCodes(['iptccat:', 'iptccat:a'])).toEqual(
			['apCat:a'],
		);
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
				'iptccat: ',
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

describe('processFingerpostAAPCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processFingerpostAAPCategoryCodes([])).toEqual([]);
	});

	it('should strip out non-valid news codes', () => {
		expect(processFingerpostAAPCategoryCodes(['and'])).toEqual([]);
	});

	it('should process valid news codes', () => {
		expect(
			processFingerpostAAPCategoryCodes([
				'04007003+food',
				'goods|04013002+food',
				'and',
				'medtop:20000049',
			]),
		).toEqual(['medtop:20000049', 'subj:04007003', 'subj:04013002']);
	});

	it('should flatten embedded news codes', () => {
		expect(
			processFingerpostAAPCategoryCodes([
				'11001000+defence|11001005+military',
				'equipment|11002000+diplomacy|04015001+air',
			]),
		).toEqual([
			'subj:11001000',
			'subj:11001005',
			'subj:11002000',
			'subj:04015001',
		]);
	});
});

describe('processFingerpostAFPCategoryCodes', () => {
	it('should return an empty array if provided with an empty array', () => {
		expect(processFingerpostAFPCategoryCodes([])).toEqual([]);
	});
	it('should strip out service codes', () => {
		expect(processFingerpostAFPCategoryCodes(['service:news'])).toEqual([]);
	});
	it('should strip out empty iptccat entries', () => {
		expect(
			processFingerpostAFPCategoryCodes(['iptccat:', 'iptccat:a']),
		).toEqual(['afpCat:a']);
	});
	it('should return simple codes labelled "iptc" as simple "afp" codes', () => {
		expect(
			processFingerpostAFPCategoryCodes(['iptccat:a', 'iptccat:b']),
		).toEqual(['afpCat:a', 'afpCat:b']);
	});
	it('should expand category codes with multiple subcodes', () => {
		expect(processFingerpostAFPCategoryCodes(['iptccat:c+d'])).toEqual([
			'afpCat:c',
			'afpCat:d',
		]);
	});
	it('should pass other codes through untransformed', () => {
		expect(processFingerpostAFPCategoryCodes(['qCode:value+value'])).toEqual([
			'qCode:value+value',
		]);
	});

	it('should remove empty strings', () => {
		expect(
			processFingerpostAFPCategoryCodes(['iptccat:a', '', 'iptccat:c']),
		).toEqual(['afpCat:a', 'afpCat:c']);
	});

	it('should remove trailing and leading whitespace', () => {
		expect(
			processFingerpostAFPCategoryCodes([
				'iptccat:a ',
				' iptccat:c',
				' service:news ',
				'iptccat: ',
				'qCode:value ',
			]),
		).toEqual(['afpCat:a', 'afpCat:c', 'qCode:value']);
	});

	it('should deduplicate category codes after stripping whitespace', () => {
		expect(
			processFingerpostAFPCategoryCodes([
				'iptccat:ECO+SOC+ECO+SOC+ECO ',
				' iptccat:ECO',
			]),
		).toEqual(['afpCat:ECO', 'afpCat:SOC']);
	});
});
