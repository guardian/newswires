import { isEqual as deepIsEqual } from 'lodash';
import type { Context, PropsWithChildren } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useState,
} from 'react';
import { z } from 'zod';
import { pandaFetch } from './panda-session';
import type { Config, Query, WiresQueryResponse } from './sharedTypes';
import {
	ConfigSchema,
	QuerySchema,
	WiresQueryResponseSchema,
} from './sharedTypes';
import {
	configToUrl,
	defaultConfig,
	defaultQuery,
	paramsToQuerystring,
	urlToConfig,
} from './urlState';

const SearchHistorySchema = z.array(
	z.object({
		query: QuerySchema,
		resultsCount: z.number(),
	}),
);

export type SearchHistory = z.infer<typeof SearchHistorySchema>;

// State Schema
const StateSchema = z.discriminatedUnion('status', [
	z.object({
		status: z.literal('initialised'),
		error: z.string().optional(),
		queryData: WiresQueryResponseSchema.optional(),
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
	}),
	z.object({
		status: z.literal('loading'),
		error: z.string().optional(),
		queryData: WiresQueryResponseSchema.optional(),
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
	}),
	z.object({
		status: z.literal('success'),
		error: z.string().optional(),
		queryData: WiresQueryResponseSchema,
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
	}),
	z.object({
		status: z.literal('error'),
		error: z.string(),
		queryData: WiresQueryResponseSchema.optional(),
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
	}),
]);

// Infer State Type
type State = z.infer<typeof StateSchema>;

// Action Schema
const ActionSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('ENTER_QUERY') }),
	z.object({
		type: z.literal('FETCH_SUCCESS'),
		query: QuerySchema,
		data: WiresQueryResponseSchema,
	}),
	z.object({ type: z.literal('FETCH_ERROR'), error: z.string() }),
	z.object({ type: z.literal('RETRY') }),
	z.object({ type: z.literal('SELECT_ITEM'), item: z.string().optional() }),
	z.object({
		type: z.literal('UPDATE_RESULTS'),
		data: WiresQueryResponseSchema,
	}),
	z.object({ type: z.literal('TOGGLE_AUTO_UPDATE') }),
]);

// Infer Action Type
type Action = z.infer<typeof ActionSchema>;

function mergeQueryData(
	existing: WiresQueryResponse | undefined,
	newData: WiresQueryResponse,
): WiresQueryResponse {
	const mergedResults = existing
		? [
				...newData.results
					.filter(
						(newItem) =>
							!existing.results
								.map((existing) => existing.id)
								.includes(newItem.id),
					)
					.map((newItem) => ({ ...newItem, isFromRefresh: true })),
				...existing.results.map((existingItem) => ({
					...existingItem,
				})),
			]
		: newData.results;
	return {
		...newData,
		results: mergedResults,
	};
}

function getUpdatedHistory(
	previousHistory: SearchHistory,
	newQuery: Query,
	newResultsCount: number,
): SearchHistory {
	if (deepIsEqual(newQuery, defaultQuery)) {
		return previousHistory;
	}
	if (Object.keys(newQuery).length === 1 && newQuery.q.length === 0) {
		return previousHistory;
	}
	const previousHistoryWithoutMatchingQueries = previousHistory.filter(
		({ query }) => !deepIsEqual(query, newQuery),
	);
	return [
		{ query: newQuery, resultsCount: newResultsCount },
		...previousHistoryWithoutMatchingQueries,
	];
}

function reducer(state: State, action: Action): State {
	switch (state.status) {
		case 'loading':
			switch (action.type) {
				case 'FETCH_SUCCESS':
					return {
						...state,
						queryData: action.data,
						successfulQueryHistory: getUpdatedHistory(
							state.successfulQueryHistory,
							action.query,
							action.data.results.length,
						),
						status: 'success',
						error: undefined,
					};

				case 'FETCH_ERROR':
					return {
						...state,
						error: action.error,
						status: 'error',
					};
				default:
					return state;
			}
		case 'success':
			switch (action.type) {
				case 'UPDATE_RESULTS':
					return {
						...state,
						queryData: mergeQueryData(state.queryData, action.data),
					};
				case 'ENTER_QUERY':
					return {
						...state,
						status: 'loading',
					};
				case 'TOGGLE_AUTO_UPDATE':
					return {
						...state,
						autoUpdate: !state.autoUpdate,
					};
				default:
					return state;
			}
		case 'error':
			switch (action.type) {
				case 'RETRY':
					return {
						...state,
						status: 'loading',
					};
				case 'ENTER_QUERY':
					return {
						...state,
						status: 'loading',
					};
				default:
					return state;
			}
		default:
			return state;
	}
}

async function fetchResults(
	query: Query,
	sinceId: string | undefined = undefined,
): Promise<WiresQueryResponse> {
	const queryToSerialise = sinceId
		? { ...query, sinceId: sinceId.toString() }
		: query;
	const queryString = paramsToQuerystring(queryToSerialise);
	const response = await pandaFetch(`/api/search${queryString}`, {
		headers: {
			Accept: 'application/json',
		},
	});
	try {
		const data = (await response.json()) as unknown;
		if (!response.ok) {
			throw new Error(
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- this is the expected shape from Play but you never know
				(data as { error: { exception: { description: string } } }).error
					.exception.description ?? 'Unknown error',
			);
		}
		const parseResult = WiresQueryResponseSchema.safeParse(data);
		if (parseResult.success) {
			return parseResult.data;
		}
		throw new Error(
			`Received invalid data from server: ${JSON.stringify(parseResult.error)}`,
		);
	} catch (e) {
		throw new Error(e instanceof Error ? e.message : 'Unknown error');
	}
}

export type SearchContextShape = {
	config: Config;
	state: State;
	handleEnterQuery: (query: Query) => void;
	handleRetry: () => void;
	handleSelectItem: (item: string) => void;
	handleDeselectItem: () => void;
	handleNextItem: () => void;
	handlePreviousItem: () => void;
	toggleAutoUpdate: () => void;
};
export const SearchContext: Context<SearchContextShape | null> =
	createContext<SearchContextShape | null>(null);

export function SearchContextProvider({ children }: PropsWithChildren) {
	const [currentConfig, setConfig] = useState<Config>(
		urlToConfig(window.location),
	);
	const [state, dispatch] = useReducer(reducer, {
		error: undefined,
		queryData: undefined,
		successfulQueryHistory: [],
		status: 'loading',
		autoUpdate: true,
	});

	const pushConfigState = useCallback(
		(config: Config) => {
			history.pushState(config, '', configToUrl(config));
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

	useEffect(() => {
		let pollingInterval: NodeJS.Timeout | undefined;

		if (state.status === 'loading') {
			fetchResults(currentConfig.query)
				.then((data) => {
					dispatch({ type: 'FETCH_SUCCESS', data, query: currentConfig.query });
				})
				.catch((error) => {
					const errorMessage =
						error instanceof Error ? error.message : 'unknown error';
					dispatch({ type: 'FETCH_ERROR', error: errorMessage });
				});
		}

		if (state.status === 'success') {
			pollingInterval = setInterval(() => {
				if (state.autoUpdate) {
					fetchResults(
						currentConfig.query,
						Math.max(
							...state.queryData.results.map((wire) => wire.id),
						).toString(),
					)
						.then((data) => {
							dispatch({ type: 'UPDATE_RESULTS', data });
						})
						.catch((error) => {
							const errorMessage =
								error instanceof Error ? error.message : 'unknown error';
							dispatch({ type: 'FETCH_ERROR', error: errorMessage });
						});
				}
			}, 6000);
		}

		return () => {
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
		};
	}, [
		state.status,
		state.autoUpdate,
		currentConfig.query,
		state.queryData?.results,
	]);

	const handleEnterQuery = (query: Query) => {
		dispatch({ type: 'ENTER_QUERY' });
		if (currentConfig.view === 'item') {
			pushConfigState({
				...currentConfig,
				query,
			});
			return;
		}
		pushConfigState({
			...currentConfig,
			view: 'feed',
			query,
		});
	};

	const handleRetry = () => {
		dispatch({ type: 'RETRY' });
	};

	const handleSelectItem = (item: string) =>
		pushConfigState({
			view: 'item',
			itemId: item,
			query: currentConfig.query,
		});

	const handleDeselectItem = () => {
		pushConfigState({ view: 'feed', query: currentConfig.query });
	};

	const handleNextItem = () => {
		const results = state.queryData?.results;
		const currentItemId = currentConfig.itemId;
		if (!results || !currentItemId) {
			return;
		}
		const currentIndex = results.findIndex(
			(wire) => wire.id.toString() === currentItemId,
		);
		if (currentIndex === -1) {
			return undefined;
		}
		const nextIndex = currentIndex + 1;
		if (nextIndex >= results.length) {
			return undefined;
		}
		handleSelectItem(results[nextIndex].id.toString());
	};

	const handlePreviousItem = () => {
		const results = state.queryData?.results;
		const currentItemId = currentConfig.itemId;
		if (!results || !currentItemId) {
			return;
		}
		const currentIndex = results.findIndex(
			(wire) => wire.id.toString() === currentItemId,
		);
		if (currentIndex === -1) {
			return undefined;
		}
		const previousIndex = currentIndex - 1;
		if (previousIndex < 0) {
			return undefined;
		}
		handleSelectItem(results[previousIndex].id.toString());
	};

	const toggleAutoUpdate = () => {
		dispatch({ type: 'TOGGLE_AUTO_UPDATE' });
	};

	return (
		<SearchContext.Provider
			value={{
				config: currentConfig,
				state,
				handleEnterQuery,
				handleRetry,
				handleSelectItem,
				handleDeselectItem,
				handleNextItem,
				handlePreviousItem,
				toggleAutoUpdate,
			}}
		>
			{children}
		</SearchContext.Provider>
	);
}

export const useSearch = () => {
	const searchContext = useContext(SearchContext);
	if (searchContext === null) {
		throw new Error('useSearch must be used within a SearchContextProvider');
	}
	return searchContext;
};
