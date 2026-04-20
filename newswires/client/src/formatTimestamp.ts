import type { Moment } from 'moment-timezone';
import type { TimezoneId } from './officeTimezones';

type FormatContext = 'wireDetail' | 'relative' | 'full' | 'settings';

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
	formatListView(currentUtcTime: Moment) {
		const m = this.toMoment();
		const nowM = this.withTz(currentUtcTime);
		return m.format(
			m.isSame(nowM, 'day') ? 'HH:mm:ss' : 'YYYY/MM/DD, HH:mm:ss',
		);
	}
	format(context: FormatContext) {
		switch (context) {
			case 'wireDetail':
				return this.toMoment().format('MMM Do YYYY, HH:mm:ss');
			case 'full':
				return this.toMoment().format();
			case 'relative':
				return this.toMoment().fromNow();
			case 'settings':
				return this.toMoment().format('HH:mm');
		}
	}
}
export class InstantMoment {
	#utcTime: Moment;
	constructor(utcTime: Moment) {
		this.#utcTime = utcTime;
	}
	toZonedMoment(timezone: TimezoneId): ZonedMoment {
		return new ZonedMoment(this.#utcTime, timezone);
	}
}
