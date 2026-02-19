import dateMath from '@elastic/datemath';
import moment from 'moment';
import { relativeDateRangeToAbsoluteDateRange } from './dateHelpers.ts';
import { EuiDateStringSchema, isValidDateValue } from './sharedTypes.ts';
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

describe('relativeDateRangeToAbsoluteDateRange', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should convert a relative date range to an absolute date range', () => {
		(dateMath.parse as jest.Mock).mockImplementation(() =>
			moment().startOf('day'),
		);

		const [start, end] = relativeDateRangeToAbsoluteDateRange({
			start: EuiDateStringSchema.parse('now-1d/d'),
			end: EuiDateStringSchema.parse('now-1d/d'),
		});

		expect(start?.toISOString()).toBe(moment().startOf('day').toISOString());
		expect(end?.toISOString()).toBe(moment().endOf('day').toISOString());
	});

	it('should convert a relative date range to a partial absolute date range when the relative end date is "now"', () => {
		(dateMath.parse as jest.Mock).mockImplementation(() =>
			moment().startOf('day'),
		);

		const [start, end] = relativeDateRangeToAbsoluteDateRange({
			start: EuiDateStringSchema.parse('now-1d/d'),
			end: EuiDateStringSchema.parse('now/d'),
		});

		expect(start?.toISOString()).toBe(moment().startOf('day').toISOString());
		expect(end?.toISOString()).toBe(undefined);
	});

	it('should convert a relative date range to a partial absolute date range when the relative end date is "now/d"', () => {
		(dateMath.parse as jest.Mock).mockImplementation(() =>
			moment().startOf('day'),
		);

		const [start, end] = relativeDateRangeToAbsoluteDateRange({
			start: EuiDateStringSchema.parse('now-1d/d'),
			end: EuiDateStringSchema.parse('now/d'),
		});

		expect(start?.toISOString()).toBe(moment().startOf('day').toISOString());
		expect(end?.toISOString()).toBe(undefined);
	});
});
