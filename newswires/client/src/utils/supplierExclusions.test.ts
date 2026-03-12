import { computeSuppliersToExclude } from './supplierExclusions.ts';

describe('computeSuppliersToExclude', () => {
	test('exclusion list should return UNAUTHED_EMAIL_FEED and PAAPI when showGuSuppliers is true', () => {
		expect(computeSuppliersToExclude(true)).toStrictEqual([
			'UNAUTHED_EMAIL_FEED',
			'PAAPI',
		]);
	});
	test('exclusion list should include gu suppliers when showGuSuppliers is false', () => {
		expect(computeSuppliersToExclude(false)).toStrictEqual([
			'UNAUTHED_EMAIL_FEED',
			'PAAPI',
			'GUAP',
			'GUREUTERS',
		]);
	});
});
