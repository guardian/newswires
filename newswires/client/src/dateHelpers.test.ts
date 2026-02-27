import moment from 'moment';
import {
	relativeDateRangeToAbsoluteDateRange,
	timeRangeOptions,
} from './dateHelpers.ts';
import { EuiDateStringSchema, isValidDateValue } from './sharedTypes.ts';
import { disableLogs } from './tests/testHelpers.ts';

beforeEach(() => {
	jest.restoreAllMocks();
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
	it('should convert a relative date range to an absolute date range, rounding the start down and the end up when ending with "/d"', () => {
		const { start, end } = relativeDateRangeToAbsoluteDateRange({
			start: EuiDateStringSchema.parse('now-1d/d'),
			end: EuiDateStringSchema.parse('now-1d/d'),
		});

		expect(start).toBe(
			moment().subtract(1, 'days').startOf('day').toISOString(),
		);
		expect(end).toBe(moment().subtract(1, 'days').endOf('day').toISOString());
	});

	interface TimeRangeOptionTestCase {
		label: string;
		resolvedStart: string | undefined;
		resolvedEnd: string | undefined;
	}
	const FIXED_NOW = '2024-02-24T16:17:36.295Z';
	const options: TimeRangeOptionTestCase[] = [
		{
			label: 'Last 30 minutes',
			resolvedStart: '2024-02-24T15:47:36.295Z',
			resolvedEnd: FIXED_NOW,
		},
		{
			label: 'Last 1 hour',
			resolvedStart: '2024-02-24T15:17:36.295Z',
			resolvedEnd: FIXED_NOW,
		},
		{
			label: 'Last 24 hours',
			resolvedStart: '2024-02-23T16:17:36.295Z',
			resolvedEnd: FIXED_NOW,
		},
		{
			label: 'Today',
			resolvedStart: '2024-02-24T00:00:00.000Z',
			resolvedEnd: '2024-02-24T23:59:59.999Z',
		},
		{
			label: 'Yesterday',
			resolvedStart: '2024-02-23T00:00:00.000Z',
			resolvedEnd: '2024-02-23T23:59:59.999Z',
		},
		{
			label: 'Last 3 days',
			resolvedStart: '2024-02-21T00:00:00.000Z',
			resolvedEnd: FIXED_NOW,
		},
		{
			label: 'Last 1 week',
			resolvedStart: '2024-02-17T16:17:36.295Z',
			resolvedEnd: FIXED_NOW,
		},
	];

	options.forEach(({ label, resolvedStart, resolvedEnd }) => {
		it(`should resolve the "${label}" quick select option to the expected absolute date range for the point of evaluation`, () => {
			// mock the current date to a fixed point in time to make the test deterministic
			jest.spyOn(Date, 'now').mockReturnValue(new Date(FIXED_NOW).getTime());
			const timeRangeOption = timeRangeOptions().find(
				(option) => option.label === label,
			);
			const { start, end } = relativeDateRangeToAbsoluteDateRange({
				start: EuiDateStringSchema.parse(timeRangeOption!.start),
				end: EuiDateStringSchema.parse(timeRangeOption!.end),
			});
			expect(start).toBe(resolvedStart);
			expect(end).toBe(resolvedEnd);
		});
	});
});
