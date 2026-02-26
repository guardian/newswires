import moment from 'moment';
import { DEFAULT_DATE_RANGE, START_OF_TODAY } from './dateConstants.ts';
import type { DateRange, EuiDateString } from './sharedTypes';
import { EuiDateStringSchema } from './sharedTypes.ts';
import { processDateRange } from './urlState';

beforeEach(() => {
	jest.restoreAllMocks();
});

describe('processDateRange', () => {
	describe('when useAbsoluteDateTimeValues is true', () => {
		describe('when dateRange is provided', () => {
			it('should convert relative dates to ISO-formatted absolute UTC dates', () => {
				jest
					.spyOn(Date, 'now')
					.mockReturnValue(new Date('2024-02-24T16:17:36.295Z').getTime());

				const dateRange: DateRange = {
					start: EuiDateStringSchema.parse('now-3d/d'),
					end: EuiDateStringSchema.parse('now-1d/d'),
				};

				const result = processDateRange(dateRange, true);

				// Should return ISO strings for both start and end
				expect(result.start).toBeDefined();
				expect(result.end).toBeDefined();
				expect(typeof result.start).toBe('string');
				expect(typeof result.end).toBe('string');
				// ISO format check
				expect(result.start).toMatch('2024-02-21T00:00:00.000Z');
				expect(result.end).toMatch('2024-02-23T00:00:00.000Z');
			});

			it('should handle "now/d" as end date (returns undefined end because isRelativeDateNow)', () => {
				const dateRange: DateRange = {
					start: EuiDateStringSchema.parse('now-1M/d'),
					end: EuiDateStringSchema.parse('now/d'),
				};

				const result = processDateRange(dateRange, true);

				// Actual behavior: "now/d" is filtered by isRelativeDateNow in relativeDateRangeToAbsoluteDateRange
				expect(result.start).toBeDefined();
				expect(typeof result.start).toBe('string');
				expect(result.end).toBeUndefined();
			});

			it('should handle "now" as end date (returns undefined end)', () => {
				const dateRange: DateRange = {
					start: EuiDateStringSchema.parse('now-1h'),
					end: EuiDateStringSchema.parse('now'),
				};

				const result = processDateRange(dateRange, true);

				// Actual behavior: "now" returns undefined for end because isRelativeDateNow returns true
				expect(result.start).toBeDefined();
				expect(typeof result.start).toBe('string');
				expect(result.end).toBeUndefined();
			});

			it('should handle same start and end dates by extending end to end of day', () => {
				const dateRange: DateRange = {
					start: EuiDateStringSchema.parse('now-1d/d'),
					end: EuiDateStringSchema.parse('now-1d/d'),
				};

				const result = processDateRange(dateRange, true);

				// When start and end are the same, end should be extended to end of day
				expect(result.start).toBeDefined();
				expect(result.end).toBeDefined();

				const startMoment = moment(result.start);
				const endMoment = moment(result.end);

				// Start should be at beginning of day (00:00:00)
				expect(startMoment.format('HH:mm:ss')).toBe('00:00:00');
				// End should be at end of day (23:59:59)
				expect(endMoment.format('HH:mm:ss')).toBe('23:59:59');
			});

			it('should handle absolute timestamp dates', () => {
				const dateRange: DateRange = {
					start: EuiDateStringSchema.parse('2024-01-01T00:00:00Z'),
					end: EuiDateStringSchema.parse('2024-01-31T23:59:59Z'),
				};

				const result = processDateRange(dateRange, true);

				expect(result.start).toBeDefined();
				expect(result.end).toBeDefined();
				expect(typeof result.start).toBe('string');
				expect(typeof result.end).toBe('string');
			});
		});

		describe('when dateRange is undefined', () => {
			it('should return start as START_OF_TODAY ISO string', () => {
				const result = processDateRange(undefined, true);

				// Actual behavior: returns only 'start' property, no 'end' property
				expect(result).toEqual({
					start: START_OF_TODAY.toISOString(),
				});
			});

			it('should not include end property when dateRange is undefined', () => {
				const result = processDateRange(undefined, true);

				// This demonstrates the actual asymmetric behavior - only 'start' is returned
				expect(result).not.toHaveProperty('end');
			});
		});
	});

	describe('when useAbsoluteDateTimeValues is false', () => {
		describe('when dateRange is provided', () => {
			it('should return start and end when both differ from default', () => {
				const dateRange: DateRange = {
					start: EuiDateStringSchema.parse('now-1M/d'),
					end: EuiDateStringSchema.parse('now-1d/d'),
				};

				const result = processDateRange(dateRange, false);

				expect(result).toEqual({
					start: 'now-1M/d',
					end: 'now-1d/d',
				});
			});

			it('should return undefined for start when it matches DEFAULT_DATE_RANGE.start', () => {
				const dateRange: DateRange = {
					start: DEFAULT_DATE_RANGE.start,
					end: EuiDateStringSchema.parse('now-1d/d'),
				};

				const result = processDateRange(dateRange, false);

				// Actual behavior: start is undefined when it equals the default
				expect(result).toEqual({
					start: undefined,
					end: 'now-1d/d',
				});
			});

			it('should return undefined for end when it matches DEFAULT_DATE_RANGE.end', () => {
				const dateRange: DateRange = {
					start: EuiDateStringSchema.parse('now-1M/d'),
					end: DEFAULT_DATE_RANGE.end,
				};

				const result = processDateRange(dateRange, false);

				// Actual behavior: end is undefined when it equals the default
				expect(result).toEqual({
					start: 'now-1M/d',
					end: undefined,
				});
			});

			it('should return both undefined when both match defaults', () => {
				const dateRange: DateRange = {
					start: DEFAULT_DATE_RANGE.start,
					end: DEFAULT_DATE_RANGE.end,
				};

				const result = processDateRange(dateRange, false);

				// Actual behavior: both are undefined when matching defaults
				expect(result).toEqual({
					start: undefined,
					end: undefined,
				});
			});
		});

		describe('when dateRange is undefined', () => {
			it('should return both start and end as undefined', () => {
				const result = processDateRange(undefined, false);

				// Actual behavior: accessing properties on undefined gives undefined
				// dateRange?.start is undefined, dateRange?.end is undefined
				expect(result).toEqual({
					start: undefined,
					end: undefined,
				});
			});
		});

		describe('edge cases with falsy start/end values', () => {
			it('should handle when dateRange.start is an empty string (if type system allows)', () => {
				// Note: This may not be possible with proper typing, but demonstrates actual runtime behavior
				const dateRange = {
					start: '' as unknown as EuiDateString,
					end: EuiDateStringSchema.parse('now'),
				} as DateRange;

				const result = processDateRange(dateRange, false);

				// Actual behavior: empty string is falsy, so start becomes undefined
				// This may indicate unintended behavior since '' !== DEFAULT_DATE_RANGE.start
				// but the && operator short-circuits on falsy values
				// Note: end is also undefined because 'now' === DEFAULT_DATE_RANGE.end
				expect(result).toEqual({
					start: undefined,
					end: undefined,
				});
			});

			it('should properly filter default start even when end is also default', () => {
				const dateRange: DateRange = {
					start: DEFAULT_DATE_RANGE.start,
					end: DEFAULT_DATE_RANGE.end,
				};

				const result = processDateRange(dateRange, false);

				// Demonstrates the && operator behavior: both checks are independent
				expect(result.start).toBeUndefined();
				expect(result.end).toBeUndefined();
			});
		});

		describe('actual vs intended behavior - empty strings', () => {
			it('demonstrates that the function filters empty strings even if they are not the default', () => {
				// This test demonstrates potentially unintended behavior:
				// The condition uses && which short-circuits on falsy values,
				// so even a non-default empty string would be filtered out
				const emptyStringDateRange = {
					start: '' as unknown as EuiDateString,
					end: EuiDateStringSchema.parse('now'),
				};

				const result = processDateRange(emptyStringDateRange, false);

				// The current implementation returns undefined for start because:
				// dateRange?.start && dateRange.start !== DEFAULT_DATE_RANGE.start
				// evaluates to: '' && ('' !== 'now/d') which is falsy, so it returns undefined
				// This may not be the intended behavior - it filters ALL falsy values, not just defaults
				expect(result.start).toBeUndefined();
			});

			it('demonstrates the same behavior for end with empty string', () => {
				const emptyStringDateRange = {
					start: EuiDateStringSchema.parse('now-1d'),
					end: '' as unknown as EuiDateString,
				};

				const result = processDateRange(emptyStringDateRange, false);

				// Same unintended filtering happens for end
				expect(result.end).toBeUndefined();
			});
		});
	});

	describe('comparison of behaviors between true and false useAbsoluteDateTimeValues', () => {
		it('shows different return shapes when dateRange is undefined', () => {
			const resultTrue = processDateRange(undefined, true);
			const resultFalse = processDateRange(undefined, false);

			// When true: returns { start: ISO_STRING } (no end property)
			expect(resultTrue).toHaveProperty('start');
			expect(resultTrue).not.toHaveProperty('end');
			expect(typeof resultTrue.start).toBe('string');

			// When false: returns { start: undefined, end: undefined } (both properties present)
			expect(resultFalse).toHaveProperty('start');
			expect(resultFalse).toHaveProperty('end');
			expect(resultFalse.start).toBeUndefined();
			expect(resultFalse.end).toBeUndefined();

			// This asymmetry may be unintended behavior
		});

		it('shows how "now" end dates are handled differently', () => {
			const dateRange: DateRange = {
				start: EuiDateStringSchema.parse('now-1h'),
				end: EuiDateStringSchema.parse('now'),
			};

			const resultTrue = processDateRange(dateRange, true);
			const resultFalse = processDateRange(dateRange, false);

			// When true: "now" as end returns undefined (filtered by isRelativeDateNow)
			expect(resultTrue.start).toBeDefined();
			expect(resultTrue.end).toBeUndefined();

			// When false: "now" as end returns undefined (filtered because it matches DEFAULT_DATE_RANGE.end)
			expect(resultFalse.start).toBe('now-1h');
			expect(resultFalse.end).toBeUndefined();
		});
	});
});
