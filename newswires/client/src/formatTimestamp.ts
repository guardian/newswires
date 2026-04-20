import type { Moment } from 'moment-timezone';
import type { TimezoneId } from './officeTimezones';

type FormatContext =
	| { type: 'humanFull' }
	| { type: 'relative' }
	| { type: 'isoString' }
	| { type: 'shortTime' }
	| { type: 'contextAware'; nowUtc: Moment };

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
			case 'humanFull':
				return m.format('MMM Do YYYY, HH:mm:ss');
			case 'isoString':
				return m.format('YYYY-MM-DDTHH:mm:ssZ');
			case 'relative':
				return m.fromNow();
			case 'shortTime':
				return m.format('HH:mm');
			case 'contextAware': {
				const nowM = this.applyTimezone(context.nowUtc);
				const sameDay = m.isSame(nowM, 'day');
				return m.format(sameDay ? 'HH:mm:ss' : 'YYYY/MM/DD, HH:mm:ss');
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
