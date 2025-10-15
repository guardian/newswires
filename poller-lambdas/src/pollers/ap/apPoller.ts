import { POLLER_FAILURE_EVENT_TYPE } from '../../../../shared/constants';
import { getErrorMessage } from '../../../../shared/getErrorMessage';
import type {
	IngestorPayload,
	LongPollFunction,
	PollFunctionInput,
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

// https://api.ap.org/media/v/content/feed?page_size=10&in_my_plan=true&include=*
export const apPoller = (async ({
	secret,
	input,
	logger,
}: PollFunctionInput) => {
	const baseUrl = 'https://api.ap.org/media/v';
	const defaultFeedUrl = `${baseUrl}/content/feed?page_size=10&in_my_plan=true&include=*`;
	const apiKey = secret;

	const headers = {
		accept: 'application/json',
		'x-api-key': apiKey,
	};

	const { feed, timeReceived } = await getFeed(input, apiKey);

	logger.log({
		message: `Received feed with ${feed.data?.current_item_count} items at ${timeReceived.toISOString()}`,
	});

	const valueForNextPoll = feed.data?.next_page
		? `${feed.data.next_page}&include=*`
		: defaultFeedUrl;

	const feedItems = feed.data?.items
		?.map(({ item }) => item)
		.filter(
			(i): i is Contentitem => i !== undefined,
		); /** @todo we should be able to remove the type predicate after we upgrade TS to 5.6 */

	/** `items[n].item` is marked as optional in the AP schema, so it's worth
	 * logging if it's missing, but we can't do much about it as there isn't any
	 * other meaningful data on the response in that case
	 */
	if (
		feed.data?.items &&
		feedItems &&
		feedItems.length < feed.data.items.length
	) {
		logger.log({
			message: `Received ${feed.data.items.length} items from AP feed, but only ${feedItems.length} contain an 'item' field.`,
		});
	}

	if (feedItems === undefined || feedItems.length === 0) {
		logger.log({ message: 'No new items in feed' });
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
				logger.log({
					externalId: feedItem.altids?.etag,
					message: `No NITF rendition found for AP item: ${feedItem.altids?.etag}; excluding from feed.`,
					eventType: POLLER_FAILURE_EVENT_TYPE,
				});
				return undefined;
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
		) /** @todo we should be able to remove the type predicate after we upgrade TS to 5.6 */
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
	attempt: number = 0,
): Promise<{ feed: FeedListData; timeReceived: Date }> {
	try {
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
	} catch (error) {
		if (attempt > 0 && attempt < 3) {
			// try again, because there are sometimes transient availability issues
			console.warn(
				`Received error from AP feed: ${getErrorMessage(error)}; trying again`,
			);
			// wait before retrying
			await new Promise((resolve) => setTimeout(resolve, 10000));
			return getFeed(url, apiKey, attempt + 1);
		} else {
			console.error(
				`Received error from AP feed on attempt number ${attempt}: ${getErrorMessage(error)}; aborting`,
			);
			throw error;
		}
	}
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
		urgency,
		firstcreated,
		versioncreated,
		bylines,
		ednote,
		subject,
		keywords,
		associations,
	} = feedItem;

	const { abstract, bodyContentHtml } = contentFromNitf;

	const bylineToUse = bylines
		? [...bylines].map((byline) => byline.by).join(', ')
		: contentFromNitf.byline;

	const directSubjects =
		subject?.filter((s) => s.rels?.includes('direct')).map((s) => s.name) ?? [];

	const keywordsAsArray = keywords?.flatMap((k) => k.split(' ')) ?? [];

	const amalgamatedKeywords = [...directSubjects, ...keywordsAsArray];

	return {
		externalId,
		body: {
			'source-feed': 'AP-Newswires',
			version: feedItem.version?.toString() ?? '0',
			type: type,
			status: pubstatus,
			firstVersion: firstcreated,
			versionCreated: versioncreated,
			headline: title ?? headline ?? contentFromNitf.headline,
			byline: bylineToUse,
			priority: urgency?.toString(),
			keywords: amalgamatedKeywords,
			body_text: bodyContentHtml,
			abstract,
			originalContentText: originalXmlContent,
			ednote,
			imageIds: associations
				? Object.keys(associations)
						.filter((key) => associations[key]?.type === 'picture')
						.map((key) => associations[key]?.altids?.itemid)
						.filter((item): item is string => item !== undefined)
				: [],
		},
	};
}
