import moment from 'moment';

export const NOW = 'now';
export const LAST_TWO_WEEKS = 'now-2w';

export const TWO_WEEKS_AGO = moment().subtract(2, 'weeks');
export const END_OF_TODAY = moment().endOf('day');
