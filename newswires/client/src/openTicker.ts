import type { Query } from './sharedTypes';
import { configToUrl } from './urlState';

export const openTicker = (query: Query) => {
	window.open(
		configToUrl({
			query,
			view: 'feed',
			itemId: undefined,
			ticker: true,
		}),
		'_blank',
		'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no',
	);
};

export const isOpenAsTicker = (): boolean => {
	return !!window.opener;
};
