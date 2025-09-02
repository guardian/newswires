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
			hasDataFormatting: true,
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
			hasDataFormatting: true,
		};
		expect(transformWireItemQueryResult(input)).toEqual(expectedOutput);
	});

	it('should set hasDataFormatting to false if content.composerCompatible is false', () => {
		const input: WireDataFromAPI = {
			id: 3,
			supplier: 'AP',
			externalId: 'external-789',
			ingestedAt: '2025-01-03T00:00:00Z',
			categoryCodes: ['category4'],
			content: { ...sampleFingerpostContent, composerCompatible: false },
			isFromRefresh: false,
		};
		const expectedOutput: WireData = {
			...input,
			supplier: supplierData.find((supplier) => supplier.name === 'AP')!,
			ingestedAt: '2025-01-03T00:00:00+00:00',
			hasDataFormatting: false,
		};
		expect(transformWireItemQueryResult(input)).toEqual(expectedOutput);
	});
});
