import moment from 'moment';
import type { Moment } from 'moment-timezone';
import type { TimezoneId } from './officeTimezones';

export class TimezonedMoment {
	#utcTime: Moment;
	constructor(utcTime: Moment) {
		this.#utcTime = utcTime;
	}
	withTimezone(timezone: TimezoneId) {
		const copy = this.#utcTime.clone();
		if (timezone == 'Local_Browser') {
			return copy.local();
		} else {
			return copy.tz(timezone);
		}
	}
}

const onlyDateFormat = (timestamp: TimezonedMoment, timezone: TimezoneId) =>
	timestamp.withTimezone(timezone).format('YYYY MMM DD');

export function formatTimestamp(
	timestamp: TimezonedMoment,
	timezone: TimezoneId,
) {
	const now = new TimezonedMoment(moment());
	const timestampIsCurrentDay =
		onlyDateFormat(now, timezone) === onlyDateFormat(timestamp, timezone);
	return timestamp
		.withTimezone(timezone)
		.format(timestampIsCurrentDay ? 'HH:mm:ss' : 'YYYY/MM/DD, HH:mm:ss');
}
