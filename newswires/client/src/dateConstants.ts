import moment from 'moment';

const TODAY = 'now/d';

export const TWO_WEEKS_AGO = moment().subtract(2, 'weeks');

export const START_OF_TODAY = moment().startOf('day');
export const END_OF_TODAY = moment().endOf('day');

export const DEFAULT_DATE_RANGE = {
	start: TODAY,
	end: 'now',
};
