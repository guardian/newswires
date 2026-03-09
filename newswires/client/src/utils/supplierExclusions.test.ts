import { computeSuppliersToExclude } from './supplierExclusions.ts';

describe('computeSuppliersToExclude', () => {
	test('exclusion list should return UNAUTHED_EMAIL_FEED when showGuSuppliers is true and showPAAPI is true', () => {
		expect(computeSuppliersToExclude(true, true)).toStrictEqual([
			'UNAUTHED_EMAIL_FEED',
		]);
	});
	test('exclusion list should include gu suppliers when showGuSuppliers is false and showPAAPI is true', () => {
		expect(computeSuppliersToExclude(false, true)).toStrictEqual([
			'UNAUTHED_EMAIL_FEED',
			'GUAP',
			'GUREUTERS',
		]);
	});
	test('exclusion list should include new pa api when showGuSuppliers is true and showPAAPI is false', () => {
		expect(computeSuppliersToExclude(true, false)).toStrictEqual([
			'UNAUTHED_EMAIL_FEED',
			'PAAPI',
		]);
	});
	test('exclusion list should include gu suppliers and new pa api when showGuSuppliers is false and showPAAPI is false', () => {
		expect(computeSuppliersToExclude(false, false)).toStrictEqual([
			'UNAUTHED_EMAIL_FEED',
			'GUAP',
			'GUREUTERS',
			'PAAPI',
		]);
	});
});
