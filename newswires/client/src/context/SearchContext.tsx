import type { Context, MouseEventHandler, PropsWithChildren } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
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
	handleEnterQuery: (query: Query) => void;
	handleRetry: () => void;
	handleSelectItem: (item: string) => void;
	handleDeselectItem: () => void;
	handleNextItem: () => void;
	handlePreviousItem: () => void;
	toggleAutoUpdate: () => void;
	loadMoreResults: (beforeId: string) => Promise<void>;
	Link: ({
		children,
		to,
	}: {
		children: React.ReactNode;
		to: Config;
	}) => JSX.Element;
};
export const SearchContext: Context<SearchContextShape | null> =
	createContext<SearchContextShape | null>(null);

export function SearchContextProvider({ children }: PropsWithChildren) {
	const [currentConfig, setConfig] = useState<Config>(
		urlToConfig(window.location),
	);

	const [state, dispatch] = useReducer(SearchReducer, {
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

		if (state.status === 'success' || state.status === 'offline') {
			pollingInterval = setInterval(() => {
				if (state.autoUpdate) {
					const sinceId =
						state.queryData.results.length > 0
							? Math.max(
									...state.queryData.results.map((wire) => wire.id),
								).toString()
							: undefined;
					fetchResults(currentConfig.query, { sinceId })
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

	const loadMoreResults = async (beforeId: string): Promise<void> => {
		return fetchResults(currentConfig.query, { beforeId })
			.then((data) => {
				dispatch({ type: 'APPEND_RESULTS', data });
			})
			.catch((error) => {
				const errorMessage =
					error instanceof Error ? error.message : 'unknown error';
				dispatch({ type: 'FETCH_ERROR', error: errorMessage });
			});
	};

	const Link = ({
		children,
		to,
	}: {
		children: React.ReactNode;
		to: Config;
	}) => {
		const href = configToUrl(to);

		const onClick: MouseEventHandler<HTMLAnchorElement> = useCallback(
			(e) => {
				if (!(e.getModifierState('Meta') || e.getModifierState('Control'))) {
					e.preventDefault();
					pushConfigState(to);
				}
			},
			[to],
		);

		return (
			<a href={href} onClick={onClick}>
				{children}
			</a>
		);
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
				Link,
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
