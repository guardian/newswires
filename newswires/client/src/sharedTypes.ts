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
		ednote: z.string(),
	})
	.partial();

export const WireDataSchema = z.object({
	id: z.number(),
	supplier: z.string(),
	externalId: z.string(),
	ingestedAt: z.string(),
	categoryCodes: z.array(z.string()),
	content: FingerpostContentSchema,
	composerId: z.string().optional(),
	composerSentBy: z.string().optional(),
	highlight: z.string().optional(),
	isFromRefresh: z.boolean().default(false),
});

export type WireData = z.infer<typeof WireDataSchema>;

export const WiresQueryResponseSchema = z.object({
	results: z.array(WireDataSchema),
	totalCount: z.number(),
	// keywordCounts: z.record(z.string(), z.number()),
});

export type WiresQueryResponse = z.infer<typeof WiresQueryResponseSchema>;

const DateRange = z.object({
	start: z.string(),
	end: z.string(),
});

export const QuerySchema = z.object({
	q: z.string(),
	supplier: z.array(z.string()).optional(),
	supplierExcl: z.array(z.string()).optional(),
	keywords: z.ostring(),
	keywordsExcl: z.ostring(),
	categoryCode: z.array(z.string()).optional(),
	categoryCodeExcl: z.array(z.string()).optional(),
	preset: z.ostring(),
	dateRange: DateRange.optional(),
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
