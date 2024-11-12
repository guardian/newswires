import { z } from 'zod';

const OptionalStringOrArrayAsArrayOfStrings = z
	.union([z.string(), z.array(z.string())])
	.optional()
	.transform((val) => {
		if (Array.isArray(val)) {
			return val;
		}
		if (val === undefined) {
			return [];
		}
		return [val];
	});

const FingerpostFeedPayloadSchema = z.object({
	uri: z.string().optional(),
	'source-feed': z.string().optional(),
	usn: z.string().optional(),
	version: z.string().optional(),
	type: z.string().optional(), // this is 'text' in every entry we have in the CODE db on 1st Nov 2024 (175553 entries at time of checking)
	format: z.string().optional(), // "GOA-WIRES-NINJS" in all records
	mimeType: z.string().optional(), // application/ninjs+json
	firstVersion: z.string().optional(),
	versionCreated: z.string().optional(),
	dateTimeSent: z.string().optional(), // more than 1/2 of the time identical to versionCreated
	originalUrn: z.string().optional(), // almost all entries have a string here, but not very unique (181803 values, only 53988 unique values)
	slug: z.string().optional(), // fp set this
	headline: z.string().optional(),
	subhead: z.string().optional(),
	byline: z.string().optional(),
	priority: z.string().optional(), // 1-5 in all records
	subjects: z
		.object({
			code: OptionalStringOrArrayAsArrayOfStrings,
		})
		.optional(),
	mediaCatCodes: z.string().optional(),
	keywords: OptionalStringOrArrayAsArrayOfStrings,
	organisation: z
		.object({
			symbols: OptionalStringOrArrayAsArrayOfStrings,
		})
		.optional(), // {"symbols": ""} {"symbols": [""]} in all records
	tabVtxt: z.string().optional(), // always 'X' or null
	status: z.string().optional(), // always one of: "" "usable" "canceled" "embargoed" "withheld"
	usage: z.string().optional(),
	ednote: z.string().optional(),
	abstract: z.string().optional(), // only present in REUTERS and AAP items
	language: z.string().optional(),
	location: z.string().optional(), // just plain string
	body_text: z.string().optional(),
	copyrightHolder: z.string().optional(),
	copyrightNotice: z.string().optional(),
});

export const IngestorInputBodySchema = FingerpostFeedPayloadSchema.extend({
	originalContentText: z.string().optional(),
});

const WireEntryContentSchema = IngestorInputBodySchema.omit({
	keywords: true,
}).extend({
	keywords: z.array(z.string()),
});

export type FingerpostFeedPayload = z.infer<typeof FingerpostFeedPayloadSchema>;
export type IngestorInputBody = z.infer<typeof IngestorInputBodySchema>;
export type WireEntryContent = z.infer<typeof WireEntryContentSchema>;
