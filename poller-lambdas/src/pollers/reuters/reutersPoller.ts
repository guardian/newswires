import { parse } from 'node-html-parser';
import { z } from 'zod';
import type { IngestorInputBody } from '../../../../shared/types';
import type {
	FixedFrequencyPollFunction,
	PollerInput,
	SecretValue,
} from '../../types';
import { auth } from './auth';

/**
 * usn: unique story number. this is the same identifier as the guid
 * version: The version of the news object which is identified by the uri property
 * versionProcessed: timestamp when this version was processed in our internal systems
 * versionedGuid: The globally unique identifier of the target item (guid) which also includes the version identifier
 */
const textItemsSearchQuery = `query NewTextItemsSearch {
search(filter: { mediaTypes: TEXT }) {
	pageInfo {
		endCursor
		hasNextPage
	}
	items {
		caption
		headLine
		uri
		usn
		versionedGuid
	}
}
}`;

const NullishToStringOrUndefinedSchema = z
	.string()
	.nullish()
	.transform((x) => x ?? undefined);

const SearchDataSchema = z.object({
	data: z.object({
		search: z.object({
			items: z.array(
				z.object({
					caption: NullishToStringOrUndefinedSchema,
					headLine: NullishToStringOrUndefinedSchema,
					uri: NullishToStringOrUndefinedSchema,
					usn: NullishToStringOrUndefinedSchema,
					versionedGuid: NullishToStringOrUndefinedSchema,
				}),
			),
		}),
	}),
});

/**
 * PF: As far as I can tell this should include basically everything that's in the NewsML download,
 * so we shouldn't need to fetch that as well.
 */
function itemQuery(itemId: string) {
	return `query ItemDetailQuery {
item(id: "${itemId}") {
    byLine
    copyrightNotice
    versionCreated
    fragment
    headLine
    versionedGuid
    uri
    language
    type
    profile
    slug
    usageTerms
    usageTermsRole
    version
    credit
    firstCreated
    productLabel
    pubStatus
    urgency
    usn
    position
    intro
    bodyXhtml
    bodyXhtmlRich
    subject {
        code
        name
        rel
    }
}}`;
}

const ReutersItemSchema = z.object({
	byLine: NullishToStringOrUndefinedSchema,
	copyrightNotice: NullishToStringOrUndefinedSchema,
	versionCreated: NullishToStringOrUndefinedSchema,
	fragment: NullishToStringOrUndefinedSchema,
	headLine: NullishToStringOrUndefinedSchema,
	versionedGuid: z.string(),
	uri: NullishToStringOrUndefinedSchema,
	language: NullishToStringOrUndefinedSchema,
	type: NullishToStringOrUndefinedSchema,
	profile: NullishToStringOrUndefinedSchema,
	slug: NullishToStringOrUndefinedSchema,
	usageTerms: NullishToStringOrUndefinedSchema,
	usageTermsRole: NullishToStringOrUndefinedSchema,
	version: NullishToStringOrUndefinedSchema,
	credit: NullishToStringOrUndefinedSchema,
	firstCreated: NullishToStringOrUndefinedSchema,
	productLabel: NullishToStringOrUndefinedSchema,
	pubStatus: NullishToStringOrUndefinedSchema,
	urgency: z
		.number()
		.nullish()
		.transform((x) => x ?? undefined),
	usn: NullishToStringOrUndefinedSchema,
	position: NullishToStringOrUndefinedSchema,
	bodyXhtml: NullishToStringOrUndefinedSchema,
	bodyXhtmlRich: NullishToStringOrUndefinedSchema,
	subject: z.array(
		z.object({
			code: NullishToStringOrUndefinedSchema,
			name: NullishToStringOrUndefinedSchema,
			rel: NullishToStringOrUndefinedSchema,
		}),
	),
});

const itemResponseSchema = z.object({
	data: z.object({
		item: ReutersItemSchema,
	}),
});

function itemResponseToIngestionLambdaInput(
	item: z.infer<typeof ReutersItemSchema>,
): IngestorInputBody {
	const { bodyXhtmlRich, bodyXhtml } = item;
	const bodyHtml = parse(bodyXhtmlRich ?? bodyXhtml ?? '').querySelector(
		'body',
	)?.innerHTML;
	return {
		originalContentText: item.bodyXhtmlRich,
		uri: item.uri,
		'source-feed': 'Reuters-Newswires',
		usn: item.usn,
		version: item.version,
		type: item.type,
		format: 'TODO',
		mimeType: 'TODO',
		firstVersion: item.firstCreated,
		versionCreated: item.versionCreated,
		dateTimeSent: item.versionCreated,
		originalUrn: item.versionedGuid,
		slug: item.slug,
		headline: item.headLine,
		byline: item.byLine,
		priority: item.urgency?.toString() ?? '',
		subjects: {
			code: item.subject
				.map((subject) => subject.code)
				.filter((_): _ is string => _ !== undefined),
		},
		mediaCatCodes: '',
		keywords: [],
		organisation: { symbols: [] },
		tabVtxt: 'X',
		status: item.pubStatus,
		usage: item.usageTerms,
		ednote: '',
		abstract: item.fragment,
		body_text: bodyHtml,
		copyrightNotice: item.copyrightNotice,
		language: item.language,
	};
}

const SecretValueSchema = z.object({
	CLIENT_ID: z.string(),
	CLIENT_SECRET: z.string(),
	ACCESS_TOKEN: z.string().optional(),
});

export const reutersPoller = (async (
	secret: SecretValue,
	input: PollerInput,
) => {
	const parsedSecret = SecretValueSchema.safeParse(JSON.parse(secret));
	if (!parsedSecret.success) {
		throw new Error('Failed to parse secret value for Reuters poller');
	}
	const { CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN } = parsedSecret.data;

	let accessToken = ACCESS_TOKEN ?? (await auth(CLIENT_ID, CLIENT_SECRET));

	async function fetchWithReauth(query: string) {
		let searchResponse = await fetch(
			'https://api.reutersconnect.com/content/graphql',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					query: query,
				}),
			},
		);
		if (searchResponse.status === 401 || searchResponse.status === 419) {
			const newAccessToken = await auth(CLIENT_ID, CLIENT_SECRET);
			accessToken = newAccessToken;
			searchResponse = await fetch(
				'https://api.reutersconnect.com/content/graphql',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({
						query: textItemsSearchQuery,
					}),
				},
			);
		}
		return (await searchResponse.json()) as unknown;
	}

	const searchData = SearchDataSchema.parse(
		await fetchWithReauth(textItemsSearchQuery),
	);

	const itemsToFetch = searchData.data.search.items
		.map((item) => item.versionedGuid)
		.filter((guid): guid is string => guid !== undefined);

	const itemResponses = await Promise.all(
		itemsToFetch.map(async (itemId) =>
			itemResponseSchema.parse(await fetchWithReauth(itemQuery(itemId))),
		),
	);

	return {
		payloadForIngestionLambda: itemResponses.map((response) => ({
			externalId: response.data.item.versionedGuid,
			body: itemResponseToIngestionLambdaInput(response.data.item),
		})),
		valueForNextPoll: input,
		idealFrequencyInSeconds: 60,
		newSecretValue:
			accessToken === ACCESS_TOKEN
				? undefined
				: JSON.stringify({ ...parsedSecret.data, ACCESS_TOKEN: accessToken }),
	};
}) satisfies FixedFrequencyPollFunction;
