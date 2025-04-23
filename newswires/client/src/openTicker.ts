import type { Config } from './sharedTypes';
import { configToUrl } from './urlState';

export const openTicker = (
	queryType: string,
	config: Config,
	value?: string,
) => {
	const query =
		queryType === 'preset'
			? {
					...config.query,
					preset: value ? value : undefined,
				}
			: {
					...config.query,
					supplier: value ? [value] : [],
				};

	window.open(
		configToUrl({
			...config,
			query,
			view: 'feed',
			itemId: undefined,
		}),
		'_blank',
		'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no',
	);
};
