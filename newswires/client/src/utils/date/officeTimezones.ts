export type TimezoneId =
	| 'America/Los_Angeles'
	| 'America/New_York'
	| 'Europe/London'
	| 'Australia/Sydney'
	| 'Local_Browser';

export const officeNameByTimezone: Map<TimezoneId, string> = new Map([
	['America/Los_Angeles', 'San Francisco'],
	['America/New_York', 'New York'],
	['Europe/London', 'London'],
	['Australia/Sydney', 'Sydney'],
	['Local_Browser', 'Browser timezone'],
]);

export const timezoneIds: TimezoneId[] = Array.from(
	officeNameByTimezone.keys(),
);
