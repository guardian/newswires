import type { Query } from './sharedTypes';
import { configToUrl } from './urlState';

export const openTicker = (query: Query) => {
	window.open(
		configToUrl({
			query,
			view: 'feed',
			itemId: undefined,
		}),
		'_blank',
		'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no',
	);
};

export const isOpenAsTicker = (): boolean => {
	const isPoppedOut = !!window.opener;
	const url = new URL(window.location.href);
	const isFeed = url.pathname.startsWith('/feed');
	return isPoppedOut && isFeed;
};
