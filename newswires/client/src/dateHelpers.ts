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
	!!(end && !isRelativeDateNow(end) && dateMath.parse(end)?.isBefore(moment()));

export const relativeDateRangeToAbsoluteDateRange = ({
	start,
	end,
}: {
	start: EuiDateString | undefined;
	end: EuiDateString | undefined;
}) => {
	const startDate = start ? dateMath.parse(start)?.local() : undefined;
	const endDate =
		end && !isRelativeDateNow(end) ? dateMath.parse(end)?.local() : undefined;

	return [
		startDate,
		endDate && startDate?.isSame(endDate) ? endDate.endOf('day') : endDate,
	];
};

export const timeRangeOption = (start: string) => {
	switch (start) {
		case '30m':
			return { start: `now-30m`, end: 'now', label: 'Last 30 minutes' };
		case '1h':
			return { start: `now-1h`, end: 'now', label: 'Last 1 hour' };
		case '24h':
			return { start: `now-24h`, end: 'now', label: 'Last 24 hours' };
		case 'today':
			return { start: 'now/d', end: 'now/d', label: 'Today' };
		case '1d':
			return { start: `now-1d/d`, end: `now-1d/d`, label: 'Yesterday' };
		case '2d':
			return {
				start: `now-2d/d`,
				end: `now-2d/d`,
				label: moment().subtract(2, 'days').format('dddd'),
			};
		case '3d':
			return { start: `now-3d`, end: `now`, label: 'Last 3 days' };
		case '1w':
			return { start: `now-1w`, end: 'now', label: 'Last 1 week' };
		default:
			return { start: `now-2w`, end: 'now', label: 'Last 14 days' };
	}
};
