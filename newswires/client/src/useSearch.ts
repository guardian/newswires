import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { querify } from './querify';
import { type WireData } from './sharedTypes';
import { WireDataArraySchema } from './sharedTypes';
import { useHistory } from './urlState';

const statuses = ['loading', 'error', 'data'] as const;

const StateSchema = z.enum(statuses);
type State = z.infer<typeof StateSchema>;

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
		data: WireDataArraySchema,
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
}) {
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
				: undefined;
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
	const [searchHistory, setSearchHistory] = useState<SearchState[]>(
		maybeSearchStateFromUrl
			? [maybeSearchStateFromUrl, ...searchStateFromStorage]
			: searchStateFromStorage,
	);

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
				localStorage.setItem('feed-searchHistory', JSON.stringify(newStack));
				return newStack;
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
				const maybeData = WireDataArraySchema.safeParse(data);
				if (maybeData.success) {
					pushSearchState({
						state: 'data',
						query: searchQuery,
						data: maybeData.data,
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
					data: data as WireData[],
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

	return { searchHistory, updateSearchQuery };
}
