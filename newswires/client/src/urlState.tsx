import { useCallback, useEffect, useState } from 'react';
import type { Config, Query } from './sharedTypes';
import { ConfigSchema } from './sharedTypes';

const defaultQuery: Query = { q: '' };

const defaultConfig: Config = Object.freeze({
	view: 'home',
	query: defaultQuery,
	itemId: undefined,
});

function urlToConfig(location: { pathname: string; search: string }): Config {
	const page = location.pathname.slice(1);
	const urlSearchParams = new URLSearchParams(location.search);
	const queryString = urlSearchParams.get('q');
	const query: Query = {
		q:
			typeof queryString === 'string' || typeof queryString === 'number'
				? queryString.toString()
				: '',
	};

	if (page === 'feed') {
		return { view: 'feed', query };
	} else if (page.startsWith('item/') && page.split('/').length === 2) {
		return { view: 'item', itemId: page.split('/')[1], query };
	} else {
		console.warn(`Page not found: "${page}", so using defaultConfig`);
		return defaultConfig;
	}
}

const configToUrl = (config: Config): string => {
	const { view, query, itemId } = config;
	switch (view) {
		case 'feed':
			return `/feed${paramsToQuerystring(query)}`;
		case 'item':
			return `/item/${itemId}${paramsToQuerystring(query)}`;
		default:
			return '/';
	}
};

export const paramsToQuerystring = (config: Query): string => {
	const params = Object.fromEntries(
		Object.entries(config).reduce<Array<[string, string]>>((acc, [k, v]) => {
			if (typeof v === 'string' && v.trim().length > 0) {
				return [...acc, [k, v.trim()]];
			} else {
				return acc;
			}
		}, []),
	);
	const querystring = new URLSearchParams(params).toString();
	return querystring.length !== 0 ? `?${querystring}` : '';
};

export const useUrlConfig = () => {
	const [currentConfig, setConfig] = useState<Config>(
		urlToConfig(window.location),
	);

	const pushConfigState = useCallback(
		(config: Config) => {
			history.pushState(config, '', configToUrl(config));
			setConfig(config);
		},
		[setConfig],
	);

	const replaceConfigState = useCallback(
		(config: Config) => {
			history.replaceState(config, '', configToUrl(config));
			setConfig(config);
		},
		[setConfig],
	);

	const popConfigStateCallback = useCallback(
		(e: PopStateEvent) => {
			const configParseResult = ConfigSchema.safeParse(e.state);
			if (configParseResult.success) {
				setConfig(configParseResult.data);
			} else {
				setConfig(defaultConfig);
			}
		},
		[setConfig],
	);

	useEffect(() => {
		if (window.history.state === null) {
			window.history.replaceState(
				currentConfig,
				'',
				configToUrl(currentConfig),
			);
		}
	}, [currentConfig]);

	useEffect(() => {
		window.addEventListener('popstate', popConfigStateCallback);
		return () => window.removeEventListener('popstate', popConfigStateCallback);
	}, [popConfigStateCallback]);

	return { currentConfig, pushConfigState, replaceConfigState };
};

export const exportedForTestingOnly = {
	urlToConfig,
	configToUrl,
	defaultConfig,
	defaultQuery,
};
