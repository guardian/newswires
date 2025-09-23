import type { Context, PropsWithChildren } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useState,
} from 'react';
import { z } from 'zod/v4';
import { getErrorMessage } from '../../../../shared/getErrorMessage.ts';
import type { Config, Query } from '../sharedTypes.ts';
import {
	ConfigSchema,
	DotcopyQuerySchema,
	QuerySchema,
	queryToDotcopyQuery,
	WiresQueryDataSchema,
} from '../sharedTypes.ts';
import { recognisedSuppliers } from '../suppliers.ts';
import { configToUrl, defaultConfig, urlToConfig } from '../urlState.ts';
import { fetchResults } from './fetchResults.ts';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './localStorage.tsx';
import { safeReducer, SearchReducer } from './SearchReducer.ts';
import { useTelemetry } from './TelemetryContext.tsx';

const SearchHistorySchema = z.array(
	z.object({
		query: QuerySchema,
		resultsCount: z.number(),
	}),
);

export type SearchHistory = z.infer<typeof SearchHistorySchema>;

// State Schema
const _StateSchema = z.discriminatedUnion('status', [
	z.object({
		status: z.literal('initialised'),
		error: z.string().optional(),
		queryData: WiresQueryDataSchema.optional(),
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
		loadingMore: z.boolean().default(false),
	}),
	z.object({
		status: z.literal('loading'),
		error: z.string().optional(),
		queryData: WiresQueryDataSchema.optional(),
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
		loadingMore: z.boolean().default(false),
	}),
	z.object({
		status: z.literal('success'),
		error: z.string().optional(),
		queryData: WiresQueryDataSchema,
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
		loadingMore: z.boolean().default(false),
	}),
	z.object({
		status: z.literal('error'),
		error: z.string(),
		queryData: WiresQueryDataSchema.optional(),
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
		loadingMore: z.boolean().default(false),
	}),
	z.object({
		status: z.literal('offline'),
		error: z.string(),
		queryData: WiresQueryDataSchema,
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
		loadingMore: z.boolean().default(false),
	}),
]);

// Infer State Type
export type State = z.infer<typeof _StateSchema>;

// Action Schema
const _ActionSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('ENTER_QUERY') }),
	z.object({ type: z.literal('LOADING_MORE') }),
	z.object({
		type: z.literal('FETCH_SUCCESS'),
		query: QuerySchema,
		data: WiresQueryDataSchema,
	}),
	z.object({
		type: z.literal('APPEND_RESULTS'),
		data: WiresQueryDataSchema,
	}),
	z.object({ type: z.literal('FETCH_ERROR'), error: z.string() }),
	z.object({ type: z.literal('RETRY') }),
	z.object({ type: z.literal('SELECT_ITEM'), item: z.string().optional() }),
	z.object({
		type: z.literal('UPDATE_RESULTS'),
		data: WiresQueryDataSchema,
		query: QuerySchema,
	}),
	z.object({ type: z.literal('TOGGLE_AUTO_UPDATE') }),
]);

// Infer Action Type
export type Action = z.infer<typeof _ActionSchema>;

export type SearchContextShape = {
	config: Config;
	state: State;
	previousItemId: string | undefined;
	viewedItemIds: string[];
	handleEnterQuery: (query: Query) => void;
	handleRetry: () => void;
	handleSelectItem: (item: string) => void;
	handleDeselectItem: () => void;
	handleNextItem: () => Promise<void>;
	handlePreviousItem: () => void;
	toggleAutoUpdate: () => void;
	openTicker: (query: Query) => void;
	loadMoreResults: (beforeId: string) => Promise<void>;
	toggleSupplier: (supplier: string) => void;
	toggleDotcopyView: () => void;
};
export const SearchContext: Context<SearchContextShape | null> =
	createContext<SearchContextShape | null>(null);

export function SearchContextProvider({ children }: PropsWithChildren) {
	const { sendTelemetryEvent } = useTelemetry();

	const [previousItemId, setPreviousItemId] = useState<string | undefined>(
		undefined,
	);

	const [currentConfig, setConfig] = useState<Config>(() =>
		urlToConfig(window.location),
	);
	const [viewedItemIds, setViewedItemIds] = useState<string[]>(() =>
		loadOrSetInLocalStorage<string[]>('viewedItemIds', z.array(z.string()), []),
	);

	const [state, dispatch] = useReducer(safeReducer(SearchReducer), {
		error: undefined,
		queryData: undefined,
		successfulQueryHistory: [],
		status: 'loading',
		autoUpdate: true,
		loadingMore: false,
	});

	function handleFetchError(error: ErrorEvent) {
		if (error instanceof Error && error.name === 'AbortError') {
			// we don't want to treat aborts as errors
			return;
		}
		dispatch({ type: 'FETCH_ERROR', error: getErrorMessage(error) });
	}

	const pushConfigState = useCallback(
		(config: Config) => {
			history.pushState(config, '', configToUrl(config));
			if (config.itemId !== undefined) {
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
			const start = performance.now();
			fetchResults({
				query: currentConfig.query,
				dotcopy: currentConfig.dotcopy,
			})
				.then((data) => {
					sendTelemetryEvent('NEWSWIRES_FETCHED_RESULTS', {
						...Object.fromEntries(
							Object.entries(currentConfig.query).map(([key, value]) => [
								`search-query_${key}`,
								JSON.stringify(value),
							]),
						),
						duration: performance.now() - start,
						resultsCount: data.results.length,
						resultsIds: data.results.map((wire) => wire.id).join(','),
						totalCount: data.totalCount,
					});
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
					fetchResults({
						query: currentConfig.query,
						sinceId,
						abortController,
						dotcopy: currentConfig.dotcopy,
					})
						.then((data) => {
							if (!abortController.signal.aborted) {
								dispatch({
									type: 'UPDATE_RESULTS',
									data,
									query: currentConfig.query,
								});
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
		sendTelemetryEvent,
		currentConfig.dotcopy,
	]);

	const handleEnterQuery = useCallback(
		(query: Query) => {
			sendTelemetryEvent(
				'NEWSWIRES_ENTER_SEARCH',
				Object.fromEntries(
					Object.entries(query).map(([key, value]) => [
						`search-query_${key}`,
						JSON.stringify(value),
					]),
				),
			);
			dispatch({
				type: 'ENTER_QUERY',
			});
			const { data, success } = DotcopyQuerySchema.safeParse(query);
			if (success) {
				// valid dotcopy queries are also valid for regular wires searches, so we don't need to modify anything
				pushConfigState({
					...currentConfig,
					query: data,
				});
			} else {
				// If the query is not valid for dotcopy, we assume the user is switching from a dotcopy view to a regular wires view.
				pushConfigState({
					...currentConfig,
					dotcopy: false,
					itemId: currentConfig.dotcopy ? undefined : currentConfig.itemId,
					query,
				});
			}
		},
		[currentConfig, pushConfigState, sendTelemetryEvent],
	);

	const handleRetry = () => {
		dispatch({ type: 'RETRY' });
	};

	const handleSelectItem = (item: string) => {
		setPreviousItemId(undefined);

		sendTelemetryEvent('NEWSWIRES_SELECT_ITEM', {
			...Object.fromEntries(
				Object.entries(currentConfig.query).map(([key, value]) => [
					`search-query_${key}`,
					JSON.stringify(value),
				]),
			),
			itemId: item,
		});

		pushConfigState({
			...currentConfig,
			itemId: item,
		});
	};

	const handleDeselectItem = () => {
		pushConfigState({
			...currentConfig,
			itemId: undefined,
		});
		if (currentConfig.itemId) {
			setPreviousItemId(currentConfig.itemId);
		}
	};

	const handleNextItem = async () => {
		const results = state.queryData?.results;
		const currentItemId = currentConfig.itemId;

		if (!results || !currentItemId) {
			return;
		}

		const currentIndex = results.findIndex(
			(wire) => wire.id.toString() === currentItemId,
		);

		if (currentIndex === -1) {
			return;
		}

		const nextIndex = currentIndex + 1;

		if (nextIndex >= results.length) {
			await loadMoreResults(results[currentIndex].id.toString(), true);
			return;
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
		sendTelemetryEvent('NEWSWIRES_TOGGLE_AUTO_UPDATE', {
			...Object.fromEntries(
				Object.entries(currentConfig.query).map(([key, value]) => [
					`search-query_${key}`,
					JSON.stringify(value),
				]),
			),
			newAutoUpdateState: !state.autoUpdate,
		});
		dispatch({ type: 'TOGGLE_AUTO_UPDATE' });
	};

	const loadMoreResults = async (
		beforeId: string,
		selectNextItem: boolean = false,
	): Promise<void> => {
		dispatch({
			type: 'LOADING_MORE',
		});

		sendTelemetryEvent('NEWSWIRES_LOAD_MORE', {
			beforeId,
		});

		return fetchResults({
			query: currentConfig.query,
			beforeId,
			dotcopy: currentConfig.dotcopy,
		})
			.then((data) => {
				dispatch({ type: 'APPEND_RESULTS', data });

				if (selectNextItem && data.results.length > 0) {
					handleSelectItem(data.results[0].id.toString());
				}
			})
			.catch(handleFetchError);
	};

	const openTicker = (query: Query) => {
		sendTelemetryEvent(
			'NEWSWIRES_OPEN_TICKER',
			Object.fromEntries(
				Object.entries(query).map(([key, value]) => [
					`search-query_${key}`,
					JSON.stringify(value),
				]),
			),
		);

		window.open(
			configToUrl({
				query,
				dotcopy: false,
				itemId: undefined,
				ticker: true,
			}),
			'_blank',
			'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no',
		);
	};

	const toggleSupplier = useCallback(
		(supplier: string) => {
			const activeSuppliers = currentConfig.query.supplier;
			// If 'activeSuppliers' is empty, that means that *all* suppliers are active.
			if (activeSuppliers.length === 0) {
				handleEnterQuery({
					...currentConfig.query,
					supplier: [supplier],
				});
				return;
			}
			const newSuppliers = activeSuppliers.includes(supplier)
				? activeSuppliers.filter((s) => s !== supplier)
				: [...activeSuppliers, supplier];
			handleEnterQuery({
				...currentConfig.query,
				// if all the suppliers are active, we don't need to specify them in the query
				supplier: recognisedSuppliers.every((s) =>
					newSuppliers.includes(s.name),
				)
					? []
					: newSuppliers,
			});
		},
		[currentConfig.query, handleEnterQuery],
	);

	const toggleDotcopyView = useCallback(() => {
		const isCurrentlyDotcopy = currentConfig.dotcopy;

		if (isCurrentlyDotcopy) {
			sendTelemetryEvent('NEWSWIRES_TOGGLE_DOTCOPY_OFF', {
				...Object.fromEntries(
					Object.entries(currentConfig.query).map(([key, value]) => [
						`search-query_${key}`,
						JSON.stringify(value),
					]),
				),
			});
			pushConfigState({
				...currentConfig,
				query: currentConfig.query,
				itemId: undefined,
				dotcopy: false,
			});
		} else {
			sendTelemetryEvent('NEWSWIRES_TOGGLE_DOTCOPY_ON', {
				...Object.fromEntries(
					Object.entries(currentConfig.query).map(([key, value]) => [
						`search-query_${key}`,
						JSON.stringify(value),
					]),
				),
			});
			// if switching to dotcopy view, we need to ensure that the query is valid for dotcopy
			pushConfigState({
				...currentConfig,
				query: queryToDotcopyQuery(currentConfig.query),
				itemId: undefined,
				dotcopy: true,
			});
		}

		dispatch({ type: 'ENTER_QUERY' });
	}, [currentConfig, pushConfigState, sendTelemetryEvent]);

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
				previousItemId,
				toggleSupplier,
				openTicker,
				toggleDotcopyView,
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
