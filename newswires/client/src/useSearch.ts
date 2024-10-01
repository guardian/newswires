import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { querify } from './querify';
import { WiresQueryResponseSchema } from './sharedTypes';
import type { WiresQueryResponse } from './sharedTypes';
import { isItemPath, useHistory } from './urlState';

const SearchStateSchema = z.discriminatedUnion('state', [
	z.object({
		query: z.string(),
		state: z.literal('loading'),
	}),
	z.object({
		query: z.string(),
		state: z.literal('error'),
		error: z.string(),
	}),
	z.object({
		query: z.string(),
		state: z.literal('data'),
		data: WiresQueryResponseSchema,
	}),
	z.object({
		state: z.literal('initialised'),
	}),
]);

export type SearchState = z.infer<typeof SearchStateSchema>;

const SearchHistorySchema = z.array(SearchStateSchema);

function decideInitialQuery({
	location,
	params,
}: {
	location: string;
	params?: Record<string, string>;
}): SearchState {
	const maybeQueryFromUrl = params?.q;
	switch (location) {
		case 'feed':
			return {
				state: 'loading',
				query: maybeQueryFromUrl ?? '',
			} as SearchState;
		default:
			return maybeQueryFromUrl
				? ({ state: 'loading', query: maybeQueryFromUrl } as SearchState)
				: ({ state: 'initialised' } as SearchState);
	}
}

function fetchStoredHistory() {
	const storedHistoryJson = localStorage.getItem('feed-searchHistory');

	if (storedHistoryJson == null) return [];

	try {
		const storedHistoryObj = JSON.parse(storedHistoryJson) as unknown;

		const maybeStoredHistory = SearchHistorySchema.safeParse(storedHistoryObj);
		if (maybeStoredHistory.success) {
			return maybeStoredHistory.data;
		} else {
			return [];
		}
	} catch (e) {
		console.log(e);
		return [];
	}
}

export function useSearch() {
	const { currentState, pushState } = useHistory();
	const maybeSearchStateFromUrl: SearchState | undefined = decideInitialQuery({
		location: currentState.location,
		params: currentState.params,
	});
	const searchStateFromStorage = fetchStoredHistory();
	const [searchHistory, setSearchHistory] = useState<SearchState[]>([
		maybeSearchStateFromUrl,
		...searchStateFromStorage,
	]);
	const currentSearchState: SearchState = useMemo(() => {
		return searchHistory[0];
	}, [searchHistory]);

	const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
		isItemPath(currentState.location)
			? currentState.location.replace('item/', '')
			: undefined,
	);
	const handleSelectItem = useCallback(
		(id: string | undefined) => {
			setSelectedItemId(id);
			pushState({
				location: id ? `item/${id}` : 'feed',
				params: currentState.params,
			});
		},
		[currentState.params, pushState],
	);
	const nextWireId = useMemo(() => {
		if (currentSearchState.state === 'data') {
			const currentIndex = currentSearchState.data.results.findIndex(
				(wire) => wire.id.toString() === selectedItemId,
			);
			if (currentIndex === -1) {
				return undefined;
			}
			const nextIndex = currentIndex + 1;
			if (nextIndex >= currentSearchState.data.results.length) {
				return undefined;
			}
			return currentSearchState.data.results[nextIndex].id.toString();
		}
		return undefined;
	}, [currentSearchState, selectedItemId]);
	const previousWireId = useMemo(() => {
		if (currentSearchState.state === 'data') {
			const currentIndex = currentSearchState.data.results.findIndex(
				(wire) => wire.id.toString() === selectedItemId,
			);
			if (currentIndex === -1) {
				return undefined;
			}
			const previousIndex = currentIndex - 1;
			if (previousIndex < 0) {
				return undefined;
			}
			return currentSearchState.data.results[previousIndex].id.toString();
		}
		return undefined;
	}, [currentSearchState, selectedItemId]);

	const searchQuery = useMemo(
		() => currentState.params?.q,
		[currentState.params?.q],
	);

	const pushSearchQuery = (query: string) => {
		pushState({ location: 'feed', params: { q: query } });
	};

	const pushSearchState = useCallback(
		(state: SearchState) => {
			setSearchHistory((prev) => {
				const newStack = [state, ...prev];
				localStorage.setItem(
					'feed-searchHistory',
					JSON.stringify(newStack.filter((s) => s.state == 'data').slice(0, 6)),
				);
				return newStack.slice(0, 20);
			});
		},
		[setSearchHistory],
	);

	const updateSearchQuery = (query: string) => {
		pushSearchQuery(query);
		pushSearchState({ query, state: 'loading' });
	};

	useEffect(() => {
		if (searchQuery == undefined) return;
		const quer = querify(searchQuery);
		fetch('/api/search' + quer)
			.then((res) => res.json())
			.then((data) => {
				const queryResponseParseResult =
					WiresQueryResponseSchema.safeParse(data);
				if (queryResponseParseResult.success) {
					pushSearchState({
						state: 'data',
						query: searchQuery,
						data: queryResponseParseResult.data,
					});
				} else {
					pushSearchState({
						state: 'error',
						query: searchQuery,
						error: 'server returned invalid data',
					});
				}
				pushSearchState({
					state: 'data',
					query: searchQuery,
					data: data as WiresQueryResponse,
				});
			})
			.catch((e) =>
				pushSearchState({
					state: 'error',
					query: searchQuery,
					error:
						e instanceof Error
							? e.message
							: typeof e === 'string'
								? e
								: 'unknown error',
				}),
			);
	}, [searchQuery, pushSearchState]);

	return {
		searchHistory,
		currentSearchState,
		updateSearchQuery,
		handleSelectItem,
		nextWireId,
		previousWireId,
		selectedItemId,
	};
}
