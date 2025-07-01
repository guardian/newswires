import { z } from 'zod/v4';

/**
 * looseObject because we want to preserve additional properties that are not defined in the schema
 * Useful to be able to test new fields
 */
const FingerpostContentSchema = z
	.looseObject({
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
		abstract: z.string(),
		bodyText: z.string(),
		ednote: z.string(),
		destinations: z.object({
			code: z.array(z.string()),
		}),
	})
	.partial();

export const WireDataFromAPISchema = z.object({
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

export type WireDataFromAPI = z.infer<typeof WireDataFromAPISchema>;

export const WiresQueryResponseSchema = z.object({
	results: z.array(WireDataFromAPISchema),
	totalCount: z.number(),
	// keywordCounts: z.record(z.string(), z.number()),
});

export type WiresQueryResponse = z.infer<typeof WiresQueryResponseSchema>;

export const suppliers = [
	'REUTERS',
	'AP',
	'AAP',
	'AFP',
	'PA',
	'GUAP',
	'GUREUTERS',
	'MINOR_AGENCIES',
	'UNKNOWN',
] as const;

const SupplierNameSchema = z.enum(suppliers);

export type SupplierName = z.infer<typeof SupplierNameSchema>;

const SupplierInfoSchema = z.object({
	name: SupplierNameSchema,
	label: z.string(),
	shortLabel: z.string(),
	colour: z.string(),
});

export type SupplierInfo = z.infer<typeof SupplierInfoSchema>;

export const WireDataSchema = WireDataFromAPISchema.extend({
	supplier: SupplierInfoSchema,
});

export type WireData = z.infer<typeof WireDataSchema>;

export const WiresQueryDataSchema = z.object({
	results: z.array(WireDataSchema),
	totalCount: z.number(),
	// keywordCounts: z.record(z.string(), z.number()),
});

export type WiresQueryData = z.infer<typeof WiresQueryDataSchema>;

const DateRange = z.object({
	start: z.string(),
	end: z.string(),
});

export const QuerySchema = z.object({
	q: z.string(),
	supplier: z.array(z.string()).optional(),
	supplierExcl: z.array(z.string()).optional(),
	keywords: z.string().optional(),
	keywordsExcl: z.string().optional(),
	categoryCode: z.array(z.string()).optional(),
	categoryCodeExcl: z.array(z.string()).optional(),
	preset: z.string().optional(),
	dateRange: DateRange.optional(),
	hasDataFormatting: z.boolean().optional(),
});

export type Query = z.infer<typeof QuerySchema>;

export const ConfigSchema = z.discriminatedUnion('view', [
	z.object({
		view: z.literal('home'),
		query: QuerySchema,
		itemId: z.undefined(),
		ticker: z.boolean().default(false),
	}),
	z.object({
		view: z.literal('feed'),
		query: QuerySchema,
		itemId: z.undefined(),
		ticker: z.boolean(),
	}),
	z.object({
		view: z.literal('item'),
		query: QuerySchema,
		itemId: z.string(),
		ticker: z.boolean(),
	}),
]);

export type Config = z.infer<typeof ConfigSchema>;
