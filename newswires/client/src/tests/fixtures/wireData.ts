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

export const sampleWireData: WireData = {
	id: 1,
	supplier: 'TestSupplier',
	externalId: 'external-123',
	ingestedAt: '2025-01-01T00:00:00.00000Z[UTC]', // UTC dates to make sure the reducer is converting dates to the local timezone.
	categoryCodes: ['category1', 'category2'],
	content: sampleFingerpostContent,
	highlight: 'Sample Highlight',
	isFromRefresh: false,
};
