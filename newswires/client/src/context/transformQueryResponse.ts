import moment from 'moment';
import type { SupplierInfo, WireData, WireDataFromAPI } from '../sharedTypes';
import { supplierData, UNKNOWN_SUPPLIER } from '../suppliers';
import { isAlert, isLead } from '../utils/contentHelpers';
import { InstantMoment } from '../utils/date/InstantMoment';

function enhanceSupplier(supplier: string): SupplierInfo {
	return supplierData.find((s) => s.name === supplier) ?? UNKNOWN_SUPPLIER;
}

export function transformWireItemQueryResult(data: WireDataFromAPI): WireData {
	return {
		isAlert: isAlert(data.content),
		isLead: isLead(data.content),
		...data,
		ingestedAtMoment: new InstantMoment(moment(data.ingestedAt)),
		supplier: enhanceSupplier(data.supplier),
		hasDataFormatting: data.content.composerCompatible === false, // if composerCompatible is missing or true, we assume true
	};
}
