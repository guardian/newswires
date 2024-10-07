import { z } from 'zod';

const FingerpostContentSchema = z.object({
	uri: z.string(),
	usn: z.string(),
	version: z.string(),
	firstVersion: z.string(),
	versionCreated: z.string(),
	dateTimeSent: z.string(),
	headline: z.string(),
	subhead: z.string(),
	byline: z.string(),
	keywords: z.array(z.string()),
	usage: z.string(),
	location: z.string(),
	body_text: z.string(),
});

export const WireDataSchema = z.object({
	id: z.number(),
	externalId: z.string(),
	ingestedAt: z.string(),
	content: FingerpostContentSchema.partial(),
});

export type WireData = z.infer<typeof WireDataSchema>;

export const WiresQueryResponseSchema = z.object({
	results: z.array(WireDataSchema),
	keywordCounts: z.record(z.string(), z.number()),
});

export type WiresQueryResponse = z.infer<typeof WiresQueryResponseSchema>;

export const QuerySchema = z.object({
	q: z.string(),
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
