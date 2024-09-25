import { error } from 'console';
import { stat } from 'fs';
import type { QueryType } from '@elastic/eui';
import {
	EuiBadge,
	EuiButton,
	EuiButtonEmpty,
	EuiCallOut,
	EuiFieldSearch,
	EuiListGroup,
	EuiPopover,
	EuiSearchBar,
	EuiText,
} from '@elastic/eui';
import { Fragment, useMemo, useState } from 'react';
import { debounce } from './debounce';
import { useSearch } from './useSearch';

export function SearchBox({
	initialQuery,
	update,
	incremental = false,
}: {
	initialQuery: string;
	update: (newQuery: string) => void;
	incremental?: boolean;
}) {
	const [query, setQuery] = useState<string>(initialQuery);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const { searchHistory } = useSearch();

	const dedupedSearchHistory = useMemo(() => {
		const successfulSearchesWithResultsCount = searchHistory
			.filter((search) => 'data' in search)
			.filter((search) => search.query !== '') // todo -- combine this with the above filter (ts type inference needs wrangling)
			.reduce((acc, search) => {
				acc.set(search.query, search.data.length);
				return acc;
			}, new Map<string, number>());
		return Array.from(successfulSearchesWithResultsCount.entries());
	}, [searchHistory]);

	const onButtonClick = () =>
		setIsPopoverOpen((isPopoverOpen) => !isPopoverOpen);
	const closePopover = () => setIsPopoverOpen(false);

	const debouncedUpdate = useMemo(() => debounce(update, 750), [update]);

	return (
		<Fragment>
			<EuiFieldSearch
				value={query}
				onChange={(e) => {
					const newQuery = e.target.value;
					setQuery(newQuery);
					if (incremental) {
						debouncedUpdate(newQuery);
					} else {
						update(newQuery);
					}
				}}
				aria-label="search wires"
				append={
					<EuiPopover
						button={
							<EuiButtonEmpty
								iconType="clock"
								iconSide="right"
								onClick={onButtonClick}
								aria-label="search history"
							/>
						}
						isOpen={isPopoverOpen}
						closePopover={closePopover}
					>
						<EuiListGroup>
							{dedupedSearchHistory.map(([query, resultsCount]) => (
								<EuiButton
									onClick={() => {
										update(query);
										closePopover();
									}}
									key={query}
								>
									{query}{' '}
									<EuiBadge
										color={resultsCount > 0 ? 'success' : 'text'}
										aria-label={`${resultsCount} results`}
									>
										{resultsCount}
									</EuiBadge>
								</EuiButton>
							))}
						</EuiListGroup>
					</EuiPopover>
				}
			/>
		</Fragment>
	);
}
