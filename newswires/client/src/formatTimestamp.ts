import type { Moment } from 'moment-timezone';
import type { TimezoneId } from './officeTimezones';

type FormatContext =
	| { type: 'wireDetail' }
	| { type: 'relative' }
	| { type: 'full' }
	| { type: 'settings' }
	| { type: 'list'; nowUtc: Moment };

export class ZonedMoment {
	#utcTime: Moment;
	#timezone: TimezoneId;
	constructor(utcTime: Moment, timezone: TimezoneId) {
		this.#utcTime = utcTime;
		this.#timezone = timezone;
	}
	private zoned() {
		return this.applyTimezone(this.#utcTime);
	}
	private applyTimezone(m: Moment) {
		const copy = m.clone();
		if (this.#timezone == 'Local_Browser') {
			return copy.local();
		} else {
			return copy.tz(this.#timezone);
		}
	}
	format(context: FormatContext) {
		const m = this.zoned();
		switch (context.type) {
			case 'wireDetail':
				return m.format('MMM Do YYYY, HH:mm:ss');
			case 'full':
				return m.format();
			case 'relative':
				return m.fromNow();
			case 'settings':
				return m.format('HH:mm');
			case 'list': {
				const nowM = this.applyTimezone(context.nowUtc);
				return m.format(
					m.isSame(nowM, 'day') ? 'HH:mm:ss' : 'YYYY/MM/DD, HH:mm:ss',
				);
			}
			default: {
				const _exhaustive: never = context;
				return _exhaustive;
			}
		}
	}
}
export class InstantMoment {
	#utcTime: Moment;
	constructor(utcTime: Moment) {
		this.#utcTime = utcTime;
	}
	toZonedMoment(timezone: TimezoneId): ZonedMoment {
		return new ZonedMoment(this.#utcTime.clone(), timezone);
	}
}
