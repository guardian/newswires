import type { Context, PropsWithChildren } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	useState,
} from 'react';
import { z } from 'zod';
import { getErrorMessage } from '../../../../shared/getErrorMessage.ts';
import type { Config, Query } from '../sharedTypes.ts';
import {
	ConfigSchema,
	QuerySchema,
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
	}),
	z.object({
		status: z.literal('loading'),
		error: z.string().optional(),
		queryData: WiresQueryDataSchema.optional(),
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
	}),
	z.object({
		status: z.literal('success'),
		error: z.string().optional(),
		queryData: WiresQueryDataSchema,
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
	}),
	z.object({
		status: z.literal('error'),
		error: z.string(),
		queryData: WiresQueryDataSchema.optional(),
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
	}),
	z.object({
		status: z.literal('offline'),
		error: z.string(),
		queryData: WiresQueryDataSchema,
		successfulQueryHistory: SearchHistorySchema,
		autoUpdate: z.boolean().default(true),
		lastUpdate: z.string().optional(),
	}),
]);

// Infer State Type
export type State = z.infer<typeof _StateSchema>;

// Action Schema
const _ActionSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('ENTER_QUERY') }),
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
		query: QuerySchema,
		data: WiresQueryDataSchema,
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
	handleNextItem: () => void;
	handlePreviousItem: () => void;
	toggleAutoUpdate: () => void;
	openTicker: (query: Query) => void;
	loadMoreResults: (beforeId: string) => Promise<void>;
	activeSuppliers: string[];
	toggleSupplier: (supplier: string) => void;
	sideNavIsOpen: boolean;
	setSideNavIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
export const SearchContext: Context<SearchContextShape | null> =
	createContext<SearchContextShape | null>(null);

export function SearchContextProvider({ children }: PropsWithChildren) {
	const { sendTelemetryEvent } = useTelemetry();

	const [previousItemId, setPreviousItemId] = useState<string | undefined>(
		undefined,
	);

	const [sideNavIsOpen, setSideNavIsOpen] = useState<boolean>(false);

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
			if (currentConfig.view === 'item') {
				pushConfigState({
					...currentConfig,
					query,
				});
			} else if (currentConfig.view === 'feed') {
				pushConfigState({
					...currentConfig,
					view: 'feed',
					query,
				});
			} else {
				pushConfigState({
					...currentConfig,
					view: 'home',
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
			view: 'item',
			itemId: item,
			query: currentConfig.query,
			ticker: currentConfig.ticker,
		});
	};

	const handleDeselectItem = () => {
		pushConfigState({
			view: 'feed',
			query: currentConfig.query,
			ticker: currentConfig.ticker,
		});

		if (currentConfig.itemId) {
			setPreviousItemId(currentConfig.itemId);
		}
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

	const loadMoreResults = async (beforeId: string): Promise<void> => {
		sendTelemetryEvent('NEWSWIRES_LOAD_MORE', {
			beforeId,
		});

		return fetchResults(currentConfig.query, { beforeId })
			.then((data) => {
				dispatch({ type: 'APPEND_RESULTS', data });
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
				view: 'feed',
				itemId: undefined,
				ticker: true,
			}),
			'_blank',
			'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no',
		);
	};

	const activeSuppliers = useMemo(
		() => currentConfig.query.supplier ?? [],
		[currentConfig.query.supplier],
	);

	const toggleSupplier = useCallback(
		(supplier: string) => {
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
		[currentConfig.query, handleEnterQuery, activeSuppliers],
	);

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
				activeSuppliers,
				toggleSupplier,
				openTicker,
				sideNavIsOpen,
				setSideNavIsOpen,
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
