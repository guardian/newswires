import type { Context, PropsWithChildren } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
	useState,
} from 'react';
import { z } from 'zod';
import type { Config, Query } from '../sharedTypes.ts';
import {
	ConfigSchema,
	QuerySchema,
	WiresQueryResponseSchema,
} from '../sharedTypes.ts';
import { configToUrl, defaultConfig, urlToConfig } from '../urlState.ts';
import { fetchResults } from './fetchResults.ts';
import { loadFromLocalStorage, saveToLocalStorage } from './localStorage.tsx';
import { SearchReducer } from './SearchReducer.ts';

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
	z.object({
		status: z.literal('offline'),
		error: z.string(),
		queryData: WiresQueryResponseSchema,
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
	}),
]);

// Infer State Type
export type State = z.infer<typeof StateSchema>;

// Action Schema
const ActionSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('ENTER_QUERY') }),
	z.object({
		type: z.literal('FETCH_SUCCESS'),
		query: QuerySchema,
		data: WiresQueryResponseSchema,
	}),
	z.object({
		type: z.literal('APPEND_RESULTS'),
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
export type Action = z.infer<typeof ActionSchema>;

export type SearchContextShape = {
	config: Config;
	state: State;
	viewedItemIds: string[];
	handleEnterQuery: (query: Query) => void;
	handleRetry: () => void;
	handleSelectItem: (item: string) => void;
	handleDeselectItem: () => void;
	handleNextItem: () => void;
	handlePreviousItem: () => void;
	toggleAutoUpdate: () => void;
	loadMoreResults: (beforeId: string) => Promise<void>;
};
export const SearchContext: Context<SearchContextShape | null> =
	createContext<SearchContextShape | null>(null);

export function SearchContextProvider({ children }: PropsWithChildren) {
	const [currentConfig, setConfig] = useState<Config>(() =>
		urlToConfig(window.location),
	);
	const [viewedItemIds, setViewedItemIds] = useState<string[]>(() =>
		loadFromLocalStorage<string[]>('viewedItemIds', z.array(z.string()), []),
	);

	const [state, dispatch] = useReducer(SearchReducer, {
		error: undefined,
		queryData: undefined,
		successfulQueryHistory: [],
		status: 'loading',
		autoUpdate: true,
	});

	function handleFetchError(error: ErrorEvent) {
		if (error instanceof Error) {
			// we don't want to treat aborts as errors
			if (error.name !== 'AbortError') {
				dispatch({ type: 'FETCH_ERROR', error: error.message });
			}
		} else {
			dispatch({ type: 'FETCH_ERROR', error: 'unknown error' });
		}
	}

	const pushConfigState = useCallback(
		(config: Config) => {
			history.pushState(config, '', configToUrl(config));
			if (config.view === 'item') {
				const updatedViewedItemIds = Array.from(
					new Set([config.itemId, ...viewedItemIds]),
				);
				setViewedItemIds(updatedViewedItemIds);
				saveToLocalStorage<string[]>('viewedItemIds', updatedViewedItemIds);
			}
			setConfig(config);
		},
		[setConfig, viewedItemIds, setViewedItemIds],
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

		const abortController = new AbortController();

		if (state.status === 'loading') {
			fetchResults(currentConfig.query, {}, abortController)
				.then((data) => {
					dispatch({ type: 'FETCH_SUCCESS', data, query: currentConfig.query });
				})
				.catch(handleFetchError);
		}

		if (state.status === 'success' || state.status === 'offline') {
			pollingInterval = setInterval(() => {
				if (state.autoUpdate) {
					const sinceId =
						state.queryData.results.length > 0
							? Math.max(
									...state.queryData.results.map((wire) => wire.id),
								).toString()
							: undefined;
					fetchResults(currentConfig.query, { sinceId }, abortController)
						.then((data) => {
							if (!abortController.signal.aborted) {
								dispatch({ type: 'UPDATE_RESULTS', data });
							}
						})
						.catch(handleFetchError);
				}
			}, 6000);
		}

		return () => {
			abortController.abort();
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

	const loadMoreResults = async (beforeId: string): Promise<void> => {
		return fetchResults(currentConfig.query, { beforeId })
			.then((data) => {
				dispatch({ type: 'APPEND_RESULTS', data });
			})
			.catch(handleFetchError);
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
				loadMoreResults,
				viewedItemIds,
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
