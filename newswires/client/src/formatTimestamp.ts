import moment from 'moment';
import type { Moment } from 'moment-timezone';
import type { TimezoneId } from './officeTimezones';

export function applyOptionalTimezone(
	timestamp: Moment,
	timezone: TimezoneId,
): Moment {
	const copy = timestamp.clone();
	if (timezone == 'Local_Browser') {
		return copy.local();
	} else {
		return copy.tz(timezone);
	}
}

const onlyDateFormat = (timestamp: Moment, timezone: TimezoneId) =>
	applyOptionalTimezone(timestamp, timezone).format('YYYY MMM DD');

export function formatTimestamp(timestamp: Moment, timezone: TimezoneId) {
	const now = moment();
	const timestampIsCurrentDay =
		onlyDateFormat(now, timezone) === onlyDateFormat(timestamp, timezone);
	return applyOptionalTimezone(timestamp, timezone).format(
		timestampIsCurrentDay ? 'HH:mm' : 'YYYY/MM/DD, HH:mm',
	);
}
