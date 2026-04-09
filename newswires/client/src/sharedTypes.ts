import type { Moment } from 'moment';
import moment from 'moment';
import { z } from 'zod/v4';

const AgencyMetadata = z.object({
	event: z.array(
		z.object({
			code: z.string(),
			profile: z.string(),
			scheme: z.string(),
			rel: z.string(),
			name: z.string(),
		}),
	),
});
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
		composerCompatible: z.boolean().optional(), // the only value we receive from the API is 'false'. If it's not present, we should assume true.
		embargo: z.string().optional(), // expected to be a UTC ISO date time string.
		profile: z.string().optional(),
		type: z.string().optional(),
		agencyMetadata: AgencyMetadata.optional(),
	})
	.partial();

export const ToolLinkSchema = z.object({
	id: z.number(),
	wireId: z.number(),
	tool: z.enum(['composer', 'incopy']),
	sentBy: z.string(),
	sentAt: z.string(),
	ref: z.string().optional(),
});
export type ToolLink = z.infer<typeof ToolLinkSchema>;

export const CollectionSchema = z.object({
	wireEntryId: z.number(),
	collectionId: z.number(),
	addedAt: z.string(),
});

export type CollectionMetadata = z.infer<typeof CollectionSchema>;

export const WireDataFromAPISchema = z.object({
	id: z.number(),
	supplier: z.string(),
	guSourceFeed: z.string(),
	externalId: z.string(),
	ingestedAt: z.iso.datetime(),
	categoryCodes: z.array(z.string()),
	precomputedCategories: z.array(z.string()),
	content: FingerpostContentSchema,
	composerId: z.string().optional(), //deprecated
	composerSentBy: z.string().optional(), //deprecated
	highlight: z.string().optional(),
	isFromRefresh: z.boolean().default(false),
	toolLinks: z.array(ToolLinkSchema).optional(),
	collections: z.array(CollectionSchema),
	s3Key: z.string().optional(),
});

export type WireDataFromAPI = z.infer<typeof WireDataFromAPISchema>;

export const WiresQueryResponseSchema = z.object({
	results: z.array(WireDataFromAPISchema),
	totalCount: z.number(),
	// keywordCounts: z.record(z.string(), z.number()),
});

export const WiresToolLinksResponseSchema = z.array(
	z.object({
		wireId: z.number(),
		toolLinks: z.array(ToolLinkSchema),
	}),
);

export const ToolLinksResponseSchema = z.array(ToolLinkSchema);

export type WireToolLinks = z.infer<typeof WiresToolLinksResponseSchema>;

export type WiresQueryResponse = z.infer<typeof WiresQueryResponseSchema>;

export type SupplierName =
	| 'REUTERS'
	| 'AP'
	| 'AAP'
	| 'AFP'
	| 'PA'
	| 'PAAPI'
	| 'GUAP'
	| 'GUREUTERS'
	| 'MINOR_AGENCIES'
	| 'UNAUTHED_EMAIL_FEED'
	| 'UNKNOWN';

export type SupplierInfo = {
	name: SupplierName;
	label: string;
	shortLabel: string;
	colour: string;
};

export type WireData = WireDataFromAPI & {
	supplier: SupplierInfo;
	localIngestedAt: Moment;
	hasDataFormatting: boolean;
	isAlert: boolean;
	isLead: boolean;
};

export type WiresQueryData = {
	results: WireData[];
	totalCount: number;
};

export const isValidDateValue = (value: string): value is EuiDateString =>
	/^now(?:[+-]\d+[smhdwMy])*(?:\/\w+)?$/.test(value) || moment(value).isValid();

export const EuiDateStringSchema = z
	.string()
	.brand<'EuiDateString'>()
	.refine((val) => isValidDateValue(val));
export type EuiDateString = z.infer<typeof EuiDateStringSchema>;

// TODO - enforce mutual exclusive typing
export type Query = {
	q: string;
	supplier?: string[];
	supplierExcl?: string[];
	keyword?: string[];
	keywordExcl?: string[];
	categoryCode?: string[];
	categoryCodeExcl?: string[];
	guSourceFeed?: string[];
	guSourceFeedExcl?: string[];
	preset?: string;
	start?: string;
	end?: string;
	hasDataFormatting?: boolean;
	previewPaApi?: boolean;
	eventCode?: string;
	collectionId?: number;
};

type FeedView = {
	view: 'feed';
	query: Query;
	itemId: undefined;
	ticker: boolean;
};

type ItemView = {
	view: 'item';
	query: Query;
	itemId: string;
	ticker: boolean;
};

type DotCopyView = {
	view: 'dotcopy';
	query: Query;
	itemId: string;
	ticker: boolean;
};

type DotCopyItemView = {
	view: 'dotcopy/item';
	query: Query;
	itemId: string;
	ticker: boolean;
};
export type Config = FeedView | ItemView | DotCopyView | DotCopyItemView;

const SortByIngestedAtSchema = z.object({ sortByKey: 'ingestedAt' });
const SortByAddedToCollectionAtSchema = z.object({
	sortByKey: z.literal('addedToCollectionAt'),
	collectionId: z.number(),
});

export function isSortByAddedToCollectionAt(
	sortBy: SortBy,
): sortBy is z.infer<typeof SortByAddedToCollectionAtSchema> {
	return sortBy.sortByKey === 'addedToCollectionAt';
}
export const SortBySchema = z
	.union([SortByIngestedAtSchema, SortByAddedToCollectionAtSchema])
	.default({ sortByKey: 'ingestedAt' });

export type SortBy = z.infer<typeof SortBySchema>;
