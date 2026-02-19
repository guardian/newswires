import moment from 'moment';
import { EuiDateStringSchema } from './sharedTypes';

const TODAY = EuiDateStringSchema.parse('now/d');

export const TWO_WEEKS_AGO = moment().subtract(2, 'weeks');

export const START_OF_TODAY = moment().startOf('day');
export const END_OF_TODAY = moment().endOf('day');

export const DEFAULT_DATE_RANGE = {
	start: TODAY,
	end: EuiDateStringSchema.parse('now'),
};
