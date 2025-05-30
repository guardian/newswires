import { convertToLocalDateString } from '../dateHelpers';
import type { SupplierInfo, WireData, WireDataFromAPI } from '../sharedTypes';
import { supplierData, UNKNOWN_SUPPLIER } from '../suppliers';

function enhanceSupplier(supplier: string): SupplierInfo {
	return supplierData.find((s) => s.name === supplier) ?? UNKNOWN_SUPPLIER;
}

export function transformWireItemQueryResult(data: WireDataFromAPI): WireData {
	return {
		...data,
		ingestedAt: convertToLocalDateString(data.ingestedAt),
		supplier: enhanceSupplier(data.supplier),
	};
}
