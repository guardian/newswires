import { z } from 'zod/v4';
import { pandaFetch } from './panda-session.ts';
import type { WireData } from './sharedTypes.ts';

type ComposerImportBody = {
	fields: ComposerImportFields;
	mainBlock?: BlockFragment;
	block?: BlockFragment;
};

type ComposerImportFields = {
	headline?: string;
	standfirst?: string;
	trailText?: string;
	linkText?: string;
	sensitive?: boolean;
	legallySensitive?: boolean;
	tableOfContents?: boolean;
	blockAds?: boolean;
	commentable?: boolean;
	relatedContentOff?: boolean;
	seoOptimised?: boolean;
	embargoedIndefinitely?: boolean;
	commissioningDesks?: string;
	keywords?: string;
	byline?: string;
	expiryDate?: number;
	thumbnail?: unknown[]; // including for completeness, but we have no images to send (yet)
	scheduledLaunch?: number;
	requestedScheduledLaunch?: number;
	embargoedUntil?: number;
};

type BlockFragment = {
	elements?: ElementFragment[];
	attributes?: Record<string, string>;
	contributors?: unknown[]; // I think these are only used by liveblogs, and only for our reporters that have a profile tag, so not suitable for wires
	tags?: unknown[]; // These seem unused at block level, and we don't yet have a way to map onto Guardian tags...
};

type TextElement = {
	elementType: 'text';
	fields: {
		text: string;
	};
	assets?: []; // no assets on text element
};

type ElementFragment = TextElement; // union other element types when implementing

// two fields among many others, but the ones we care about are:
const ComposerCreateContentResponseSchema = z.object({
	data: z.object({
		id: z.string(),
		contentChangeDetails: z.object({
			data: z.object({
				created: z.object({
					user: z.object({
						email: z.string(),
						firstName: z.string(),
						lastName: z.string(),
					}),
				}),
			}),
		}),
	}),
});

const COMPOSER_HOST = window.location.hostname.endsWith('.gutools.co.uk')
	? 'composer.gutools.co.uk'
	: window.location.hostname.endsWith('.local.dev-gutools.co.uk')
		? 'composer.local.dev-gutools.co.uk'
		: 'composer.code.dev-gutools.co.uk';

export const composerPageForId = (composerId: string): string =>
	`https://${COMPOSER_HOST}/content/${composerId}`;

export const sendToComposer = async (
	headline: string | undefined,
	wireData: WireData,
) => {
	const fields: ComposerImportFields = {
		headline: headline,
		standfirst: wireData.content.subhead,
		trailText: wireData.content.subhead,
		byline: wireData.content.byline,
	};
	const block: BlockFragment = {
		elements: [
			{
				elementType: 'text',
				fields: {
					text: wireData.content.bodyText ?? '',
				},
			},
		],
	};

	const body: ComposerImportBody = { block, fields };

	const url = `https://${COMPOSER_HOST}/api/content?originatingSystem=newswires&type=article`;

	const response = await pandaFetch(url, {
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		// TODO handle error for this content already been sent
		return Promise.reject(
			new Error(`Composer failed to create content; status ${response.status}`),
		);
	}
	const responseBody = ComposerCreateContentResponseSchema.safeParse(
		await response.json(),
	);

	if (!responseBody.success) {
		return Promise.reject(
			new Error(
				`Composer created content but returned unexpected data: ${responseBody.error.message}`,
			),
		);
	}

	return linkToComposer(
		wireData.id,
		responseBody.data.data.id,
		responseBody.data.data.contentChangeDetails.data.created.user.email,
	);
};

const linkToComposer = async (
	wireId: number,
	composerId: string,
	sentBy: string,
) => {
	const maybeCsrfToken = document
		.querySelector('meta[data-name="csrfToken"]')
		?.getAttribute('data-value');

	if (!maybeCsrfToken) {
		return Promise.reject(
			new Error(
				`Created composer page at ${composerPageForId(composerId)} but failed to store that in newswires due to missing CSRF token!`,
			),
		);
	}

	const response = await pandaFetch(`/api/item/${wireId}/composerId`, {
		method: 'PUT',
		credentials: 'same-origin',
		mode: 'same-origin',
		body: JSON.stringify({ composerId, sentBy }),
		headers: {
			'Content-Type': 'application/json',
			'Csrf-Token': maybeCsrfToken,
		},
	});

	if (!response.ok) {
		return Promise.reject(
			new Error(
				`Created composer page at ${composerPageForId(composerId)}, but failed to store that into the newswires database: status ${response.status}`,
			),
		);
	}

	return { composerId, sentBy };
};
