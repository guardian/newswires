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

const KeywordCountSchema = z.object({
	keyword: z.string(),
	count: z.number(),
});

export const KeywordCountsSchema = z.array(KeywordCountSchema);

export type KeywordCounts = z.infer<typeof KeywordCountsSchema>;
