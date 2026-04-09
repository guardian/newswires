import moment from 'moment';
import type { Moment } from 'moment';
import { applyOptionalTimezone } from '../formatTimestamp.ts';
import type { TimezoneId } from '../officeTimezones.ts';
import type { SupplierInfo, WireData, WireDataFromAPI } from '../sharedTypes';
import { supplierData, UNKNOWN_SUPPLIER } from '../suppliers';
import { isAlert, isLead } from '../utils/contentHelpers';

export class MomentInstant {
	#utc: Moment;

	constructor(utc: string) {
		this.#utc = moment(utc);
	}

	withTimezone(tz: TimezoneId): Moment {
		return applyOptionalTimezone(this.#utc, tz);
	}
}

function enhanceSupplier(supplier: string): SupplierInfo {
	return supplierData.find((s) => s.name === supplier) ?? UNKNOWN_SUPPLIER;
}

export function transformWireItemQueryResult(data: WireDataFromAPI): WireData {
	const newData = {
		...data,
		ingestedAt: undefined,
	};

	return {
		isAlert: isAlert(data.content),
		isLead: isLead(data.content),
		...newData,
		utcIngestedAt: new MomentInstant(data.ingestedAt),
		supplier: enhanceSupplier(data.supplier),
		hasDataFormatting: data.content.composerCompatible === false, // if composerCompatible is missing or true, we assume true
	};
}
