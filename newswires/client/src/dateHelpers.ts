import dateMath from '@elastic/datemath';
import moment from 'moment-timezone';
import type { EuiDateString } from './sharedTypes';

export const convertToLocalDate = (timestamp: string) => {
	const localTime = moment.utc(timestamp).local();

	if (!localTime.isValid()) {
		throw new Error(`Invalid timestamp: ${timestamp}`);
	}

	return localTime;
};

export const convertToLocalDateString = (timestamp: string): string => {
	return convertToLocalDate(timestamp).format();
};

export const isRelativeDateNow = (relativeDate: string) =>
	relativeDate === 'now' || relativeDate === 'now/d';

export const isRestricted = (end: string | undefined): boolean =>
	!!(
		end &&
		!isRelativeDateNow(end) &&
		dateMath.parse(end, { roundUp: true })?.isBefore(moment())
	);

export const relativeDateRangeToAbsoluteDateRange = ({
	start,
	end,
}: {
	start: EuiDateString | undefined;
	end: EuiDateString | undefined;
}) => {
	// Convert relative dates to ISO-formatted absolute UTC dates, as required by the backend API.
	const maybeStartString = start
		? dateMath.parse(start)?.toISOString()
		: undefined;
	const maybeEndString = end
		? dateMath.parse(end, { roundUp: true })?.toISOString()
		: undefined;
	return {
		start: maybeStartString,
		end: maybeEndString,
	};
};

export const timeRangeOptions = () => [
	{ start: `now-30m`, end: 'now', label: 'Last 30 minutes' },
	{ start: `now-1h`, end: 'now', label: 'Last 1 hour' },
	{ start: `now-24h`, end: 'now', label: 'Last 24 hours' },
	{ start: 'now/d', end: 'now/d', label: 'Today' },
	{ start: `now-1d/d`, end: `now-1d/d`, label: 'Yesterday' },
	{
		start: `now-2d/d`,
		end: `now-2d/d`,
		label: moment().subtract(2, 'days').format('dddd'),
	},
	{ start: `now-3d/d`, end: `now`, label: 'Last 3 days' },
	{ start: `now-1w`, end: 'now', label: 'Last 1 week' },
];
