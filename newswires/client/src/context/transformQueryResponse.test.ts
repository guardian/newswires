import moment from 'moment';
import { TimezonedMoment } from '../formatTimestamp';
import type { WireDataFromAPI } from '../sharedTypes';
import { supplierData, UNKNOWN_SUPPLIER } from '../suppliers';
import { sampleFingerpostContent } from '../tests/fixtures/wireData';
import { transformWireItemQueryResult } from './transformQueryResponse';

const baseInput: WireDataFromAPI = {
	id: 1,
	supplier: 'REUTERS',
	guSourceFeed: 'REUTERS',
	externalId: 'external-123',
	ingestedAt: '2025-01-01T00:00:00Z',
	categoryCodes: ['category1', 'category2'],
	content: sampleFingerpostContent,
	isFromRefresh: false,
	collections: [],
	precomputedCategories: [],
};

describe('transformWireItemQueryResult', () => {
	it('should enhance supplier with additional properties, and transform UTC timestamps', () => {
		const result = transformWireItemQueryResult(baseInput);
		expect(result.supplier).toEqual(
			supplierData.find((supplier) => supplier.name === 'REUTERS'),
		);
		expect(result.localIngestedAt).toEqual(
			new TimezonedMoment(moment(baseInput.ingestedAt)),
		);
	});

	it('should handle unknown suppliers', () => {
		const input: WireDataFromAPI = {
			...baseInput,
			supplier: 'This is not a recognised supplier',
		};
		const result = transformWireItemQueryResult(input);
		expect(result.supplier).toEqual(UNKNOWN_SUPPLIER);
	});

	it('should set hasDataFormatting to true if content.composerCompatible is false', () => {
		const input: WireDataFromAPI = {
			...baseInput,
			content: { ...sampleFingerpostContent, composerCompatible: false },
		};
		const result = transformWireItemQueryResult(input);
		expect(result.hasDataFormatting).toBe(true);
	});

	it('should set hasDataFormatting to false if content.composerCompatible is true or missing', () => {
		const inputWithTrue: WireDataFromAPI = {
			...baseInput,
			content: { ...sampleFingerpostContent, composerCompatible: true },
		};
		const resultWithTrue = transformWireItemQueryResult(inputWithTrue);
		expect(resultWithTrue.hasDataFormatting).toBe(false);

		const inputWithoutComposerCompatible: WireDataFromAPI = {
			...baseInput,
			content: { ...sampleFingerpostContent, composerCompatible: undefined },
		};
		const resultWithoutComposerCompatible = transformWireItemQueryResult(
			inputWithoutComposerCompatible,
		);
		expect(resultWithoutComposerCompatible.hasDataFormatting).toBe(false);
	});

	describe('isAlert and isLead determination', () => {
		it('should determine isAlert and isLead based on type and profile', () => {
			const alertContent = {
				...sampleFingerpostContent,
				type: 'text',
				profile: 'alert',
			};
			const leadContent = {
				...sampleFingerpostContent,
				type: 'composite',
				profile: 'story',
			};
			const inputAlert: WireDataFromAPI = {
				...baseInput,
				content: alertContent,
			};
			const inputLead: WireDataFromAPI = {
				...baseInput,
				content: leadContent,
			};
			const resultAlert = transformWireItemQueryResult(inputAlert);
			const resultLead = transformWireItemQueryResult(inputLead);
			expect(resultAlert.isAlert).toBe(true);
			expect(resultAlert.isLead).toBe(false);
			expect(resultLead.isAlert).toBe(false);
			expect(resultLead.isLead).toBe(true);
		});
		it('should return false for isAlert and isLead if type and profile do not match the specific combinations', () => {
			const nonAlertLeadContent = {
				...sampleFingerpostContent,
				type: 'text',
				profile: 'story',
			};
			const input: WireDataFromAPI = {
				...baseInput,
				content: nonAlertLeadContent,
			};
			const result = transformWireItemQueryResult(input);
			expect(result.isAlert).toBe(false);
			expect(result.isLead).toBe(false);
		});
	});
});
