import type { WireData, WireDataFromAPI } from '../sharedTypes';
import { supplierData, UNKNOWN_SUPPLIER } from '../suppliers';
import { sampleFingerpostContent } from '../tests/fixtures/wireData';
import { transformWireItemQueryResult } from './transformQueryResponse';

describe('transformWireItemQueryResult', () => {
	it('should enhance supplier with additional properties, and transform UTC timestamps', () => {
		const input: WireDataFromAPI = {
			id: 1,
			supplier: 'REUTERS',
			externalId: 'external-123',
			ingestedAt: '2025-01-01T00:00:00Z',
			categoryCodes: ['category1', 'category2'],
			content: sampleFingerpostContent,
			isFromRefresh: false,
		};
		const expectedOutput: WireData = {
			...input,
			supplier: supplierData.find((supplier) => supplier.name === 'REUTERS')!,
			ingestedAt: '2025-01-01T00:00:00+00:00',
		};

		expect(transformWireItemQueryResult(input)).toEqual(expectedOutput);
	});

	it('should handle unknown suppliers', () => {
		const input: WireDataFromAPI = {
			id: 2,
			supplier: 'This is not a recognised supplier',
			externalId: 'external-456',
			ingestedAt: '2025-01-02T00:00:00Z',
			categoryCodes: ['category3'],
			content: sampleFingerpostContent,
			isFromRefresh: false,
		};
		const expectedOutput: WireData = {
			...input,
			supplier: UNKNOWN_SUPPLIER,
			ingestedAt: '2025-01-02T00:00:00+00:00',
		};
		expect(transformWireItemQueryResult(input)).toEqual(expectedOutput);
	});
});
