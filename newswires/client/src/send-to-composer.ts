import { WireData } from './sharedTypes.ts';
import { pandaFetch } from './panda-session.ts';

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

const COMPOSER_HOST = window.location.hostname.endsWith('.gutools.co.uk')
	? 'composer.gutools.co.uk'
	: window.location.hostname.endsWith('.local.dev-gutools.co.uk')
		? 'composer.local.dev-gutools.co.uk'
		: 'composer.code.dev-gutools.co.uk';

export const sendToComposer = (wireData: WireData) => {
	const fields: ComposerImportFields = {
		headline: wireData.content.headline,
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

	return pandaFetch(url, {
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json',
		},
	});
};
