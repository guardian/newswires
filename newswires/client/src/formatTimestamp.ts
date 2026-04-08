import moment from 'moment';
import type { Moment } from 'moment-timezone';
import type { TimezoneId } from './officeTimezones';

const onlyDateFormat = (timestamp: Moment, timezone: TimezoneId) =>
	timestamp.clone().tz(timezone).format('YYYY MMM DD');

export function formatTimestamp(timestamp: Moment, timezone: TimezoneId) {
	const now = moment();
	const timestampInTz = timestamp.clone().tz(timezone);
	const formatString =
		onlyDateFormat(now, timezone) === onlyDateFormat(timestamp, timezone)
			? 'HH:mm'
			: 'YYYY/MM/DD, HH:mm';
	return timestampInTz.format(formatString);
}
