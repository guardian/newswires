import type { WireData } from '../sharedTypes.ts';

export const isAlert = (content: WireData['content']) =>
	content.type === 'text' && content.profile === 'alert';

export const isLead = (content: WireData['content']) =>
	content.type === 'composite' && content.profile === 'story';
