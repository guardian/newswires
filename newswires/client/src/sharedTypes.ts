import { z } from 'zod';

const FingerpostContentSchema = z
	.object({
		uri: z.string(),
		sourceFeed: z.string(),
		usn: z.string(),
		version: z.string(),
		status: z.string(),
		firstVersion: z.string(),
		versionCreated: z.string(),
		dateTimeSent: z.string(),
		slug: z.string(),
		headline: z.string(),
		subhead: z.string(),
		byline: z.string(),
		priority: z.string(),
		subjects: z.object({
			code: z.array(z.string()),
		}),
		keywords: z.array(z.string()),
		language: z.string(),
		usage: z.string(),
		location: z.string(),
		bodyText: z.string(),
	})
	.partial();

export const WireDataSchema = z.object({
	id: z.number(),
	externalId: z.string(),
	ingestedAt: z.string(),
	content: FingerpostContentSchema,
});

export type WireData = z.infer<typeof WireDataSchema>;

export const WiresQueryResponseSchema = z.object({
	results: z.array(WireDataSchema),
	// keywordCounts: z.record(z.string(), z.number()),
});

export type WiresQueryResponse = z.infer<typeof WiresQueryResponseSchema>;

export const QuerySchema = z.object({
	q: z.string(),
	supplier: z.array(z.string()).optional(),
	supplierExcl: z.array(z.string()).optional(),
	keywords: z.ostring(),
	keywordsExcl: z.ostring(),
	subjects: z.ostring(),
	subjectsExcl: z.ostring(),
	bucket: z.ostring(),
});

export type Query = z.infer<typeof QuerySchema>;

export const ConfigSchema = z.discriminatedUnion('view', [
	z.object({
		view: z.literal('home'),
		query: QuerySchema,
		itemId: z.undefined(),
	}),
	z.object({
		view: z.literal('feed'),
		query: QuerySchema,
		itemId: z.undefined(),
	}),
	z.object({
		view: z.literal('item'),
		query: QuerySchema,
		itemId: z.string(),
	}),
]);

export type Config = z.infer<typeof ConfigSchema>;
