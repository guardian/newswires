import dateMath from '@elastic/datemath';
import moment from 'moment-timezone';
import { DEFAULT_DATE_RANGE } from './dateConstants';

export interface TimeRange {
	start: string;
	end: string;
}

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

export const isValidDateValue = (value: string) =>
	/^now(?:[+-]\d+[smhdwMy])*(?:\/\w+)?$/.test(value) || moment(value).isValid();

export const isRelativeDateNow = (relativeDate: string) =>
	relativeDate === 'now' || relativeDate === 'now/d';

export const isRestricted = (end: string | undefined): boolean =>
	!!(end && !isRelativeDateNow(end) && dateMath.parse(end)?.isBefore(moment()));

export const deriveDateMathRangeLabel = (
	start: string,
	end: string,
): string => {
	// Relative range ending at "now" (e.g. now-1m, now-30m, now-1h, now-24h)
	if (end === 'now') {
		const regex = /^now-(\d+)([smhdw])$/;
		const match = start.match(regex);
		if (match) {
			const value = parseInt(match[1], 10);
			const unit = match[2];
			let unitWord = '';
			if (unit === 's') {
				unitWord = value === 1 ? 'second' : 'seconds';
			} else if (unit === 'm') {
				unitWord = value === 1 ? 'minute' : 'minutes';
			} else if (unit === 'h') {
				unitWord = value === 1 ? 'hour' : 'hours';
			} else if (unit === 'd') {
				unitWord = value === 1 ? 'day' : 'days';
			} else if (unit === 'w') {
				unitWord = value === 1 ? 'week' : 'weeks';
			}
			return `Last ${value} ${unitWord}`;
		}
	}

	// Day-rounded ranges (e.g. now/d, now-1d/d, now-2d/d)
	// The regex checks for patterns like "now/d" or "now-1d/d"
	const dayRegex = /^(now(?:-\d+d)?)\/d$/;
	if (dayRegex.test(start) && dayRegex.test(end) && start === end) {
		if (start === 'now/d') {
			return 'Today';
		} else {
			const match = start.match(/^now-(\d+)d\/d$/);
			if (match) {
				const daysAgo = parseInt(match[1], 10);
				if (daysAgo === 1) {
					return 'Yesterday';
				} else {
					const targetDate = moment().startOf('day').subtract(daysAgo, 'days');
					return targetDate.format('dddd');
				}
			}
		}
	}

	// Try to convert the date math date range to moment js objects
	// If dateMath.parse doesn't work, start and end might be timestamps
	const startMoment =
		dateMath.parse(start, { roundUp: false }) ?? moment(start);
	const endMoment = dateMath.parse(end, { roundUp: true }) ?? moment(end);

	if (!startMoment.isValid() || !endMoment.isValid()) {
		return '';
	}

	return `${startMoment.format('MMM D')} - ${endMoment.format('MMM D')}`;
};

export const relativeDateRangeToAbsoluteDateRange = ({
	start,
	end,
}: TimeRange) => {
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

export function isDefaultDateRange(dateRange: {
	start: string;
	end: string;
}): boolean {
	return (
		dateRange.start === DEFAULT_DATE_RANGE.start &&
		dateRange.end === DEFAULT_DATE_RANGE.end
	);
}
