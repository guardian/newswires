import type { Moment } from 'moment';
import type { TimezoneId } from './officeTimezones';
import { ZonedMoment } from './ZonedMoment';

export class InstantMoment {
	#utcTime: Moment;
	constructor(utcTime: Moment) {
		this.#utcTime = utcTime;
	}
	toZonedMoment(timezone: TimezoneId): ZonedMoment {
		return new ZonedMoment(this.#utcTime.clone(), timezone);
	}
}
