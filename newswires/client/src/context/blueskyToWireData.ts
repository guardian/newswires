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

type BlueskyEmbed = NonNullable<PostView['embed']>;
type BlueskyEmbedOf<T extends string> = Extract<BlueskyEmbed, { $type: T }>;
type BlueskyRecordEmbed = BlueskyEmbedOf<'app.bsky.embed.record#view'>;
type BlueskyRecord = BlueskyRecordEmbed['record'];
type BlueskyRecordOf<T extends string> = Extract<BlueskyRecord, { $type: T }>;
type BlueskyGalleryImage = Extract<
	BlueskyEmbedOf<'app.bsky.embed.gallery#view'>['items'][number],
	{ $type: 'app.bsky.embed.gallery#viewImage' }
>;

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function postTextToHtml(text: string): string {
	if (!text) return '';
	return `<p>${escapeHtml(text).replace(/\n/g, '<br />')}</p>`;
}

function imageToHtml(src: string, alt: string): string {
	return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />${
		alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : ''
	}</figure>`;
}

// Renders the record referenced by a quote/record embed. Only the common cases
// (a quoted post, or a missing/blocked post) are handled for this first pass.
function recordEmbedToHtml(record: BlueskyRecord): string {
	switch (record.$type) {
		case 'app.bsky.embed.record#viewRecord': {
			const { author, value } =
				record as BlueskyRecordOf<'app.bsky.embed.record#viewRecord'>;
			const name = author.displayName ?? author.handle;
			const text = typeof value.text === 'string' ? value.text : '';
			return [
				'<blockquote>',
				`<p><strong>${escapeHtml(name)}</strong> (@${escapeHtml(author.handle)})</p>`,
				postTextToHtml(text),
				'</blockquote>',
			].join('');
		}
		case 'app.bsky.embed.record#viewNotFound':
			return '<p><em>Quoted post not found.</em></p>';
		case 'app.bsky.embed.record#viewBlocked':
			return '<p><em>Quoted post is blocked.</em></p>';
		default:
			// Detached quotes, lists, feeds, labelers and starter packs are
			// omitted for now.
			return '';
	}
}

// Extracts a Bluesky post embed into a fragment of HTML suitable for the
// WireData bodyText. Note: <img> tags require the body sanitiser
// (htmlFormatBody) to allow them; otherwise only the links/text survive.
function embedToHtml(embed: BlueskyEmbed): string {
	switch (embed.$type) {
		case 'app.bsky.embed.images#view':
			return (embed as BlueskyEmbedOf<'app.bsky.embed.images#view'>).images
				.map((image) => imageToHtml(image.fullsize, image.alt))
				.join('');
		case 'app.bsky.embed.gallery#view':
			return (embed as BlueskyEmbedOf<'app.bsky.embed.gallery#view'>).items
				.filter(
					(item): item is BlueskyGalleryImage =>
						item.$type === 'app.bsky.embed.gallery#viewImage',
				)
				.map((item) => imageToHtml(item.fullsize, item.alt))
				.join('');
		case 'app.bsky.embed.video#view': {
			const video = embed as BlueskyEmbedOf<'app.bsky.embed.video#view'>;
			return [
				video.thumbnail
					? `<img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.alt ?? 'Video')}" />`
					: '',
				`<p><a href="${escapeHtml(video.playlist)}">Video${
					video.alt ? `: ${escapeHtml(video.alt)}` : ''
				}</a></p>`,
			].join('');
		}
		case 'app.bsky.embed.external#view': {
			const { uri, title, description } = (
				embed as BlueskyEmbedOf<'app.bsky.embed.external#view'>
			).external;
			return [
				`<p><a href="${escapeHtml(uri)}">${escapeHtml(title || uri)}</a>`,
				description ? `<br />${escapeHtml(description)}` : '',
				'</p>',
			].join('');
		}
		case 'app.bsky.embed.record#view':
			return recordEmbedToHtml((embed as BlueskyRecordEmbed).record);
		case 'app.bsky.embed.recordWithMedia#view': {
			const { media, record } =
				embed as BlueskyEmbedOf<'app.bsky.embed.recordWithMedia#view'>;
			return embedToHtml(media) + recordEmbedToHtml(record.record);
		}
		default:
			return '';
	}
}

/** Sketch: maps a Bluesky post onto a minimal WireData object. */
export function blueskyPostToWireData(post: PostView): WireData {
	const text = typeof post.record.text === 'string' ? post.record.text : '';
	const byline = post.author.displayName ?? post.author.handle;
	// Normalise to UTC ISO so it sorts consistently against wire ingestedAt.
	const ingestedAt = moment(post.indexedAt).toISOString();

	const embedHtml = post.embed ? embedToHtml(post.embed) : '';
	const bodyText = [postTextToHtml(text), embedHtml].filter(Boolean).join('\n');

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
			bodyText,
			byline,
			slug: post.author.handle,
		},
		collections: [],
		isFromRefresh: false,
		hasDataFormatting: false,
		isAlert: false,
		isLead: false,
	};
}
