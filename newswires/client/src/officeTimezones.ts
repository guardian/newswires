export type TimezoneId =
	| 'America/Los_Angeles'
	| 'America/New_York'
	| 'Europe/London'
	| 'Australia/Sydney';

export const officeNameByTimezone: Record<TimezoneId, string> = {
	'America/Los_Angeles': 'San Francisco',
	'America/New_York': 'New York',
	'Europe/London': 'London',
	'Australia/Sydney': 'Sydney',
};

export const timezoneIds: TimezoneId[] = Object.keys(
	officeNameByTimezone,
) as TimezoneId[];
