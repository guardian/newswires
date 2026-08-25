import moment from 'moment';
import type { PostView } from '../../../../src/lexicons/app/bsky/feed/defs.js';
import type { WireData } from '../sharedTypes.ts';
import { supplierData, UNKNOWN_SUPPLIER } from '../suppliers.ts';
import { InstantMoment } from '../utils/date/InstantMoment.ts';

// Marks a WireData as originating from Bluesky rather than the wires API.
export const BLUESKY_SOURCE_FEED = 'bluesky';

const BLUESKY_SUPPLIER =
	supplierData.find((s) => s.name === 'BLUESKY') ?? UNKNOWN_SUPPLIER;

export const isBlueskyWireData = (wire: WireData): boolean =>
	wire.guSourceFeed === BLUESKY_SOURCE_FEED;

// WireData ids are numeric, but Bluesky posts are keyed by string CIDs, so we
// derive a stable-ish number from the CID to avoid React key collisions.
function cidToNumericId(cid: string): number {
	let hash = 0;
	for (let i = 0; i < cid.length; i++) {
		hash = (hash * 31 + cid.charCodeAt(i)) | 0;
	}
	return 0 - Math.abs(hash);
}

/** Sketch: maps a Bluesky post onto a minimal WireData object. */
export function blueskyPostToWireData(post: PostView): WireData {
	const text = typeof post.record.text === 'string' ? post.record.text : '';
	const byline = post.author.displayName ?? post.author.handle;
	// Normalise to UTC ISO so it sorts consistently against wire ingestedAt.
	const ingestedAt = moment(post.indexedAt).toISOString();

	return {
		id: cidToNumericId(post.cid),
		supplier: BLUESKY_SUPPLIER,
		guSourceFeed: BLUESKY_SOURCE_FEED,
		externalId: post.uri,
		ingestedAt,
		ingestedAtMoment: new InstantMoment(moment(ingestedAt)),
		categoryCodes: [],
		precomputedCategories: [],
		content: {
			headline: text.split('\n')[0],
			bodyText: text,
			byline,
		},
		collections: [],
		isFromRefresh: false,
		hasDataFormatting: false,
		isAlert: false,
		isLead: false,
	};
}
