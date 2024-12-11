import { writeFileSync } from 'node:fs';
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
import type { ContentFromNitf } from './parseNitfContent';
import { parseNitfContent } from './parseNitfContent';

type FeedItemWithContent = {
	feedItem: Contentitem;
	originalXmlContent: string;
	contentFromNitf: ContentFromNitf;
};

export const apPoller = (async (secret: SecretValue, input: PollerInput) => {
	// todo: remove '-preview' from baseUrl when we go live
	const baseUrl = 'https://api.ap.org/media/v-preview/';
	const defaultFeedUrl = `${baseUrl}/content/feed?page_size=10&in_my_plan=true`;
	const apiKey = secret;

	const headers = {
		accept: 'application/json',
		'x-api-key': apiKey,
	};

	const { feed, timeReceived } = await getFeed(input, apiKey);

	console.log(
		`Received feed with ${feed.data?.current_item_count} items at ${timeReceived.toISOString()}`,
	);

	const valueForNextPoll = feed.data?.next_page ?? defaultFeedUrl;

	const feedItems = feed.data?.items
		?.map(
			({ item }) => item,
		) /** @todo: do we want to do anything with items that don't have an 'item' field? */
		.filter(
			(i): i is Contentitem => i !== undefined,
		); /** @todo we should be able to remove the type predicate after we upgrade TS to around 5.6 */

	if (feedItems === undefined || feedItems.length === 0) {
		console.log('No new items in feed');
		return {
			payloadForIngestionLambda: [],
			valueForNextPoll,
		};
	}

	const feedItemsWithContent: Array<
		| {
				feedItem: Contentitem;
				originalXmlContent: string;
				contentFromNitf: ContentFromNitf;
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
			const contentFromNitf = parseNitfContent(content);
			return { feedItem, originalXmlContent: content, contentFromNitf };
		}),
	);

	const payloadForIngestionLambda: IngestorPayload[] = feedItemsWithContent
		.filter(
			(i): i is FeedItemWithContent => i !== undefined,
		) /** @todo we should be able to remove the type predicate after we upgrade TS to around 5.6 */
		.map(itemWithContentToDesiredOutput);

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
	url: string,
	apiKey: string,
): Promise<{ feed: FeedListData; timeReceived: Date }> {
	const headers: HeadersInit = {
		accept: 'application/json',
		'x-api-key': apiKey,
	};

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
	contentFromNitf,
}: {
	feedItem: Contentitem;
	originalXmlContent: string;
	contentFromNitf: ContentFromNitf;
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
		headline,
		editorialpriority,
		firstcreated,
		versioncreated,
		bylines,
		ednote,
	} = feedItem;

	const { abstract, bodyContentHtml } = contentFromNitf;

	const bylineToUse = bylines
		? [...bylines].map((byline) => byline.by).join(', ')
		: contentFromNitf.byline;

	return {
		externalId,
		body: {
			'source-feed': 'AP-Newswires',
			version: feedItem.version?.toString() ?? '0',
			type: type,
			status: pubstatus,
			firstVersion: firstcreated, // todo: should double-check that these line up once we've got the feed back
			versionCreated: versioncreated,
			headline: title ?? headline ?? contentFromNitf.headline,
			byline: bylineToUse,
			priority: editorialpriority,
			keywords: [],
			body_text: bodyContentHtml,
			abstract,
			originalContentText: originalXmlContent,
			ednote,
		},
	};
}
