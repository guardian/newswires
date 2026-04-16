import moment from 'moment';
import type { Moment } from 'moment-timezone';
import type { TimezoneId } from './officeTimezones';

export class ZonedMoment {
	#utcTime: Moment;
	#timezone: TimezoneId;
	constructor(utcTime: Moment, timezone: TimezoneId) {
		this.#utcTime = utcTime;
		this.#timezone = timezone;
	}
	private toMoment() {
		return this.withTz(this.#utcTime);
	}
	private withTz(m: Moment) {
		const copy = m.clone();
		if (this.#timezone == 'Local_Browser') {
			return copy.local();
		} else {
			return copy.tz(this.#timezone);
		}
	}
	formatListView() {
		const now = this.withTz(moment());
		const timestampIsCurrentDay =
			now.format('YYYY MMM DD') === this.toMoment().format('YYYY MMM DD');
		const formatString = timestampIsCurrentDay
			? 'HH:mm:ss'
			: 'YYYY/MM/DD, HH:mm:ss';
		return this.toMoment().format(formatString);
	}
}
export class InstantMoment {
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
	toZonedMoment(timezone: TimezoneId): ZonedMoment {
		return new ZonedMoment(this.#utcTime, timezone);
	}
}
