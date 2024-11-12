import type {
	IngestorPayload,
	LongPollFunction,
	PollerInput,
	SecretValue,
} from '../../types';
import type {
	Contentitem,
	FeedListData,
	FeedListError,
} from './generated/apApi';
import { parseNitfContent } from './parseNitfContent';

export const apPoller = (async (secret: SecretValue, input: PollerInput) => {
	// todo: remove '-preview' from baseUrl when we go live
	const baseUrl = 'https://api.ap.org/media/v-preview/';
	const apiKey = secret;

	const headers = {
		accept: 'application/json',
		'x-api-key': apiKey,
	};

	const { feed, timeReceived } = await getFeed(baseUrl, apiKey, input);

	const valueForNextPoll = feed.data?.next_page;

	console.log(feed.data?.items?.length);
	console.log(JSON.stringify(feed.data?.items));

	const feedItems = feed.data?.items
		?.map(({ item }) => item) // todo: do we want to do anything with items that don't have an 'item' field?
		.filter((i) => i !== undefined);

	if (feedItems === undefined || feedItems.length === 0) {
		console.log('No new items in feed');
		return {
			payloadForIngestionLambda: [],
			valueForNextPoll,
		};
	}

	const mostRecentVersionCreated = feedItems
		.map((item) => item.versioncreated)
		.filter((v) => v !== undefined)
		.reduce((a, b) => (a > b ? a : b), '');

	console.log(
		`received feed with ${feedItems.length} items at ${timeReceived.toISOString()}; most recent version created is ${mostRecentVersionCreated}`,
	);

	const feedItemsWithContent: Array<
		| {
				feedItem: Contentitem;
				originalXmlContent: string;
				html: { abstract: string | undefined; bodyContent: string };
		  }
		| undefined
	> = await Promise.all(
		feedItems.map(async (feedItem) => {
			const maybeNitfUrl = feedItem.renditions?.nitf?.href;
			if (maybeNitfUrl === undefined) {
				return undefined; // todo: do we want to do anything with items that don't have a nitf rendition (i.e. content)?
			}
			const resp = await fetch(maybeNitfUrl, { headers });
			const content = await resp.text();
			const html = parseNitfContent(content);
			return { feedItem, originalXmlContent: content, html };
		}),
	);

	const payloadForIngestionLambda: IngestorPayload[] = feedItemsWithContent
		.filter((i) => i !== undefined)
		.map(itemWithContentToDesiredOutput);

	// todo: remove once we have a dedicated API key!!
	await new Promise((resolve) => setTimeout(resolve, 30000));

	return {
		payloadForIngestionLambda,
		valueForNextPoll,
	};
}) satisfies LongPollFunction;

function isFeedListData(
	feed: FeedListData | FeedListError,
): feed is FeedListData {
	return 'data' in feed;
}

function isFeedListError(
	feed: FeedListData | FeedListError,
): feed is FeedListError {
	return 'error' in feed;
}

async function getFeed(
	baseUrl: string,
	apiKey: string,
	nextPage?: string,
): Promise<{ feed: FeedListData; timeReceived: Date }> {
	const headers: HeadersInit = {
		accept: 'application/json',
		'x-api-key': apiKey,
	};

	const url =
		nextPage ?? `${baseUrl}/content/feed?page_size=10&in_my_plan=true`;

	console.log(`polling for feed at ${url}`);

	const resp = await fetch(url, {
		headers,
	});
	const timeReceived = new Date();
	const feed = (await resp.json()) as unknown as FeedListData | FeedListError;
	if (isFeedListError(feed)) {
		throw new Error(feed.error?.message);
	}
	if (!isFeedListData(feed)) {
		throw new Error('Unexpected response from API');
	}
	return { feed, timeReceived };
}

function itemWithContentToDesiredOutput({
	feedItem,
	originalXmlContent,
	html,
}: {
	feedItem: Contentitem;
	originalXmlContent: string;
	html: { abstract: string | undefined; bodyContent: string };
}): IngestorPayload {
	/**
	 * We want our external id to be unique for each revision of a content item; the 'etag' field fits the criteria:
	 * "The ETag value is a unique token for each revision of a content item, which changes not only when there are updates to the story body or item metadata, but also to any item component; for example, if new linked curated media or media renditions are added to the content item."
	 * https://api.ap.org/media/v/docs/#t=Managing_Revisions_and_Duplicates.htm
	 */
	const externalId = feedItem.altids?.etag ?? 'no-external-id';
	const {
		type,
		pubstatus,
		title,
		editorialpriority,
		firstcreated,
		versioncreated,
	} = feedItem;

	const { abstract, bodyContent } = html;

	return {
		item: {
			externalId,
			body: {
				'source-feed': 'AP-Newswires',
				version: feedItem.version?.toString() ?? '0',
				type: type,
				status: pubstatus,
				firstVersion: firstcreated, // todo: should double-check that these line up once we've got the feed back
				versionCreated: versioncreated,
				headline: title,
				subhead: '???',
				byline: '???',
				priority: editorialpriority,
				subjects: {
					code: '???',
				},
				mediaCatCodes: '???',
				keywords: '???',
				organisation: {
					symbols: '???',
				},
				body_text: bodyContent,
				abstract,
				originalContentText: originalXmlContent,
			},
		},
	};
}
