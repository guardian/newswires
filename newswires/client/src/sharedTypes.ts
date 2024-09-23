import * as v from 'valibot';

const FingerPostContentSchema = v.object({
	uri: v.optional(v.string()),
	usn: v.optional(v.string()),
	version: v.optional(v.string()),
	firstVersion: v.optional(v.string()),
	versionCreated: v.optional(v.string()),
	dateTimeSent: v.optional(v.string()),
	headline: v.optional(v.string()),
	subhead: v.optional(v.string()),
	byline: v.optional(v.string()),
	keywords: v.optional(v.string()),
	usage: v.optional(v.string()),
	location: v.optional(v.string()),
	body_text: v.optional(v.string()),
});

export const WireDataSchema = v.object({
	id: v.number(),
	externalId: v.string(),
	ingestedAt: v.string(),
	content: FingerPostContentSchema,
});

export const WireDataArraySchema = v.array(WireDataSchema);

export type WireData = v.InferOutput<typeof WireDataSchema>;
