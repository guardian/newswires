import dateMath from '@elastic/datemath';
import moment from 'moment';
import {
	dateMathRangeToDateRange,
	deriveDateMathRangeLabel,
} from './dateMathHelpers.ts';

jest.mock('@elastic/datemath', () => ({
	__esModule: true,
	default: {
		parse: jest.fn(),
	},
}));

describe('dateMathRangeToDateRange', () => {
	it('should convert a date math range to a date/time range', () => {
		(dateMath.parse as jest.Mock).mockImplementation(() =>
			moment().startOf('day'),
		);

		const [start, end] = dateMathRangeToDateRange({
			start: 'now/d',
			end: 'now/d',
		});

		expect(start?.toISOString()).toBe(moment().startOf('day').toISOString());
		expect(end?.toISOString()).toBe(moment().endOf('day').toISOString());
	});
});

describe('deriveDateMathRangeLabel', () => {
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
});
