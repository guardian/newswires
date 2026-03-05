import { convertToLocalDate } from '../../dateHelpers.ts';
import type { WireData } from '../../sharedTypes.ts';

export const sampleFingerpostContent = {
	uri: 'http://example.com',
	sourceFeed: 'TestFeed',
	usn: 'usn123',
	version: 'v1',
	status: 'active',
	firstVersion: 'v1',
	versionCreated: '2025-01-01T00:00:00Z',
	dateTimeSent: '2025-01-01T00:00:00Z',
	slug: 'sample-slug',
	headline: 'Sample Headline',
	subhead: 'Sample Subhead',
	byline: 'Author Name',
	priority: 'high',
	subjects: {
		code: ['subject1', 'subject2'],
	},
	keywords: ['keyword1', 'keyword2'],
	language: 'en',
	usage: 'general',
	location: 'location1',
	bodyText: 'Sample body text.',
};

export const sampleWireResponse = {
	id: 1,
	supplier: 'UNKNOWN',
	externalId: 'external-123',
	ingestedAt: '2025-01-01T00:00:00Z',
	categoryCodes: ['category1', 'category2'],
	content: sampleFingerpostContent,
	highlight: 'Sample Highlight',
	isFromRefresh: false,
	collections: [],
};

export const sampleWireData: WireData = {
	...sampleWireResponse,
	supplier: {
		name: 'UNKNOWN',
		label: 'Unknown Supplier',
		shortLabel: 'Unknown',
		colour: '#000000',
	},
	localIngestedAt: convertToLocalDate('2025-01-01T00:00:00Z'),
	hasDataFormatting: false,
};
