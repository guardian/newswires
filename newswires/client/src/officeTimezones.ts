export type TimezoneId =
	| 'America/Los_Angeles'
	| 'America/New_York'
	| 'Europe/London'
	| 'Australia/Sydney'
	| 'Local_Browser';

export const officeNameByTimezone: Record<TimezoneId, string> = {
	'America/Los_Angeles': 'San Francisco',
	'America/New_York': 'New York',
	'Europe/London': 'London',
	'Australia/Sydney': 'Sydney',
	Local_Browser: 'Browser timezone',
};

export const timezoneIds: TimezoneId[] = Object.keys(
	officeNameByTimezone,
) as TimezoneId[];
