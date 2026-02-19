import { isValidDateValue } from './sharedTypes.ts';
import { disableLogs } from './tests/testHelpers.ts';

jest.mock('@elastic/datemath', () => ({
	__esModule: true,
	default: {
		parse: jest.fn(),
	},
}));

describe('isValidDateValue', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	['now', 'now-3h', 'now-1M-3d', 'now-2w/d'].forEach((value) => {
		it(`should validate ${value} value`, () => {
			expect(isValidDateValue(value)).toBe(true);
		});
	});

	it(`should validate a timestamp value`, () => {
		expect(isValidDateValue('2024-02-24T16:17:36.295Z')).toBe(true);
	});

	it(`should invalidate invalid value`, () => {
		disableLogs();
		expect(isValidDateValue('invalid')).toBe(false);
	});
});
