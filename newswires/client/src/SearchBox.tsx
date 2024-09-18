import type { QueryType } from '@elastic/eui';
import {
	EuiBadge,
	EuiButton,
	EuiCallOut,
	EuiFlexGroup,
	EuiFlexItem,
	EuiSearchBar,
} from '@elastic/eui';
import { Fragment, useMemo, useState } from 'react';
import { debounce } from './debounce';
import type { SearchState } from './useSearch';

export function SearchBox({
	initialQuery,
	update,
	searchHistory,
	incremental = false,
}: {
	initialQuery: string;
	update: (newQuery: string) => void;
	searchHistory: SearchState[];
	incremental?: boolean;
}) {
	const [query, setQuery] = useState<QueryType>(initialQuery);
	const [error, setError] = useState<null | Error>(null);

	const debouncedUpdate = useMemo(() => debounce(update, 750), [update]);

	const successfulSearches = useMemo(
		() =>
			searchHistory
				.filter((search) => 'data' in search)
				.filter((search) => search.query !== '') // todo -- combine this with the above filter (ts type inference needs wrangling)
				.reduce((acc, search) => {
					acc.set(search.query, search.data.length);
					return acc;
				}, new Map<string, number>()),
		[searchHistory],
	);

	return (
		<Fragment>
			<EuiFlexGroup alignItems="center">
				{Array.from(successfulSearches.entries())
					.slice(0, 3)
					.map(([query, resultsCount]) => (
						<EuiFlexItem grow={false} key={query}>
							<EuiButton
								size="s"
								onClick={() => {
									setQuery(query);
									update(query);
								}}
							>
								{query.length > 15 ? `${query.slice(0, 8)}...` : query}{' '}
								<EuiBadge color={'success'}>{resultsCount}</EuiBadge>
							</EuiButton>
						</EuiFlexItem>
					))}
				<EuiFlexItem>
					<EuiSearchBar
						query={query}
						onChange={({ query, error }) => {
							if (error) {
								setError(error);
							} else {
								setError(null);
								setQuery(query);
								if (incremental) {
									debouncedUpdate(query.text);
								} else {
									update(query.text);
								}
							}
						}}
						box={{ incremental }}
						aria-label="search wires"
					/>
				</EuiFlexItem>
			</EuiFlexGroup>
			{error && (
				<EuiCallOut
					iconType="faceSad"
					color="danger"
					title={`Invalid search: ${error.message}`}
				/>
			)}
		</Fragment>
	);
}
