import {
	EuiBadge,
	EuiButton,
	EuiButtonEmpty,
	EuiFieldSearch,
	EuiListGroup,
	EuiPopover,
	EuiText,
} from '@elastic/eui';
import { useMemo, useState } from 'react';
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
	const [query, setQuery] = useState<string>(initialQuery);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const dedupedSearchHistory = useMemo(() => {
		const successfulSearchesWithResultsCount = searchHistory
			.reverse()
			.filter((search) => 'data' in search)
			.filter((search) => search.query !== '') // todo -- combine this with the above filter (ts type inference needs wrangling)
			.reduce((acc, search) => {
				acc.set(search.query, search.data.results.length);
				return acc;
			}, new Map<string, number>());
		return Array.from(successfulSearchesWithResultsCount.entries());
	}, [searchHistory]);

	const onButtonClick = () =>
		setIsPopoverOpen((isPopoverOpen) => !isPopoverOpen);
	const closePopover = () => setIsPopoverOpen(false);

	const debouncedUpdate = useMemo(() => debounce(update, 750), [update]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				update(query);
			}}
		>
			<EuiFieldSearch
				value={query}
				onChange={(e) => {
					const newQuery = e.target.value;
					setQuery(newQuery);
					if (incremental) {
						debouncedUpdate(newQuery);
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
						{dedupedSearchHistory.length === 0 ? (
							<EuiText color="subdued">No search history</EuiText>
						) : (
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
						)}
					</EuiPopover>
				}
			/>
		</form>
	);
}
