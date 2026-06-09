import type { WireData, WireDataFromAPI } from '../sharedTypes.ts';

export const isAlert = (content: WireData['content']) =>
	content.type === 'text' && content.profile === 'alert';

export const isLead = (content: WireData['content']) =>
	content.type === 'composite' && content.profile === 'story';

const mediaDirectSourceFeeds = [
	'PA',
	'PA PA RACING DATA',
	'PA DATA FORMATTING',
	'PA PA SPORT DATA',
];

export const isMediaDirectItem = (wireData: WireDataFromAPI) => {
	const { guSourceFeed } = wireData;
	return mediaDirectSourceFeeds.includes(guSourceFeed);
};
