import dateMath from '@elastic/datemath';
import moment from 'moment';

export interface TimeRange {
	start?: string;
	end?: string;
}

export const dateMathRangeToDateRange = ({ start, end }: TimeRange) => {
	const startDate = start ? dateMath.parse(start) : undefined;
	const endDate = end && end !== 'now' ? dateMath.parse(end) : undefined;

	return [
		startDate,
		startDate?.isSame(endDate) ? endDate?.endOf('day') : endDate,
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
			return {
				start: 'now/d',
				end: 'now/d',
				label: 'Today',
			};
		case '1d':
			return {
				start: `now-1d/d`,
				end: `now-1d/d`,
				label: 'Yesterday',
			};
		case '2d':
			return {
				start: `now-2d/d`,
				end: `now-2d/d`,
				label: moment().subtract(2, 'days').format('dddd'),
			};
		default:
			return { start: `now-2w`, end: 'now', label: 'Last 14 days' };
	}
};
