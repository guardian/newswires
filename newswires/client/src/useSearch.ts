import { useEffect, useMemo, useState } from 'react';
import { querify } from './querify';
import type { WireData } from './sharedTypes';
import { useHistory } from './urlState';

export type SearchState = { query: string } & (
	| { loading: true }
	| { error: string }
	| { data: WireData[] }
);

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
			return { loading: true, query: maybeQueryFromUrl ?? '' } as SearchState;
		default:
			return maybeQueryFromUrl
				? ({ loading: true, query: maybeQueryFromUrl } as SearchState)
				: undefined;
	}
}

export function useSearch() {
	const { currentState, pushState } = useHistory();
	const initialSearchState: SearchState | undefined = decideInitialQuery({
		location: currentState.location,
		params: currentState.params,
	});
	const [searchHistory, setSearchHistory] = useState<SearchState[]>(
		initialSearchState ? [initialSearchState] : [],
	);

	const searchQuery = useMemo(
		() => currentState.params?.q,
		[currentState.params?.q],
	);

	const pushSearchQuery = (query: string) => {
		pushState({ location: 'feed', params: { q: query } });
	};

	const pushSearchState = (state: SearchState) => {
		setSearchHistory((prev) => [state, ...prev]);
	};

	const updateSearchQuery = (query: string) => {
		pushSearchQuery(query);
		pushSearchState({ query, loading: true });
	};

	useEffect(() => {
		if (searchQuery == undefined) return;
		const quer = querify(searchQuery);
		fetch('/api/search' + quer)
			.then((res) => res.json())
			.then((data) =>
				pushSearchState({ query: searchQuery, data: data as WireData[] }),
			)
			.catch((e) =>
				pushSearchState({
					query: searchQuery,
					error:
						e instanceof Error
							? e.message
							: typeof e === 'string'
								? e
								: 'unknown error',
				}),
			);
	}, [searchQuery]);

	return { searchHistory, updateSearchQuery };
}
