import type { WireData } from '../sharedTypes.ts';

export const isAlert = (content: WireData['content']) =>
	content.type === 'text' && content.profile === 'alert';
