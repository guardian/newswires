import moment from 'moment';
import {
	deriveDateMathRangeLabel,
	isValidDateValue,
	relativeDateRangeToAbsoluteDateRange,
} from './dateHelpers.ts';
import { disableLogs } from './tests/testHelpers.ts';

beforeEach(() => {
	jest.clearAllMocks();
});

describe('isValidDateValue', () => {
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
	it('should convert a relative date range to an absolute date range', () => {
		const [start, end] = relativeDateRangeToAbsoluteDateRange({
			start: 'now-1d/d',
			end: 'now-1d/d',
		});

		expect(start?.toISOString()).toBe(moment().startOf('day').toISOString());
		expect(end?.toISOString()).toBe(moment().endOf('day').toISOString());
	});

	it('should convert a relative date range to a partial absolute date range when the relative end date is "now"', () => {
		const [start, end] = relativeDateRangeToAbsoluteDateRange({
			start: 'now-1d/d',
			end: 'now/d',
		});

		expect(start?.toISOString()).toBe(moment().startOf('day').toISOString());
		expect(end?.toISOString()).toBe(undefined);
	});

	it('should convert a relative date range to a partial absolute date range when the relative end date is "now/d"', () => {
		const [start, end] = relativeDateRangeToAbsoluteDateRange({
			start: 'now-1d/d',
			end: 'now/d',
		});

		expect(start?.toISOString()).toBe(moment().startOf('day').toISOString());
		expect(end?.toISOString()).toBe(undefined);
	});
});

describe('deriveDateMathRangeLabel', () => {
	it('should return "Last 1 second" for "now-1s" to "now"', () => {
		expect(deriveDateMathRangeLabel('now-1s', 'now')).toBe('Last 1 second');
	});

	it('should return "Last 10 seconds" for "now-1s0" to "now"', () => {
		expect(deriveDateMathRangeLabel('now-10s', 'now')).toBe('Last 10 seconds');
	});

	it('should return "Last 1 minute" for "now-1m" to "now"', () => {
		expect(deriveDateMathRangeLabel('now-1m', 'now')).toBe('Last 1 minute');
	});

	it('should return "Last 30 minutes" for "now-30m" to "now"', () => {
		expect(deriveDateMathRangeLabel('now-30m', 'now')).toBe('Last 30 minutes');
	});

	it('should return "Last 1 hour" for "now-1h" to "now"', () => {
		expect(deriveDateMathRangeLabel('now-1h', 'now')).toBe('Last 1 hour');
	});

	it('should return "Last 24 hours" for "now-24h" to "now"', () => {
		expect(deriveDateMathRangeLabel('now-24h', 'now')).toBe('Last 24 hours');
	});

	it('should return "Last 1 week" for "now-1w" to "now"', () => {
		expect(deriveDateMathRangeLabel('now-1w', 'now')).toBe('Last 1 week');
	});

	it('should return "Last 2 weeks" for "now-2w" to "now"', () => {
		expect(deriveDateMathRangeLabel('now-2w', 'now')).toBe('Last 2 weeks');
	});

	it('should return "Today" for "now/d" to "now/d"', () => {
		expect(deriveDateMathRangeLabel('now/d', 'now/d')).toBe('Today');
	});

	it('should return "Yesterday" for "now-1d/d" to "now-1d/d"', () => {
		expect(deriveDateMathRangeLabel('now-1d/d', 'now-1d/d')).toBe('Yesterday');
	});

	it('should return the day name for "now-2d/d" to "now-2d/d"', () => {
		const expectedDayName = moment()
			.startOf('day')
			.subtract(2, 'days')
			.format('dddd');

		expect(deriveDateMathRangeLabel('now-2d/d', 'now-2d/d')).toBe(
			expectedDayName,
		);
	});

	it('should return a formatted date range for absolute ISO dates when end date is not today', () => {
		const start = '2025-02-23T00:20:43.493Z';
		const end = '2025-02-25T00:20:51.294Z';
		expect(deriveDateMathRangeLabel(start, end)).toBe('Feb 23 - Feb 25');
	});

	it('should return a formatted date range  for "now-3d" to "now-2d/d"', () => {
		jest
			.spyOn(Date, 'now')
			.mockImplementation(() => new Date('2024-02-26T12:00:00Z').getTime());
		expect(deriveDateMathRangeLabel('now-3d', 'now-2d/d')).toBe(
			'Feb 23 - Feb 24',
		);
	});
});
