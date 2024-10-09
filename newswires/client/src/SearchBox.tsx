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
import type { Query } from './sharedTypes';
import { paramsToQuerystring } from './urlState';
import type { SearchHistory } from './useSearch';

export function SearchBox({
	initialQuery,
	update,
	searchHistory,
	incremental = false,
}: {
	initialQuery: Query;
	update: (newQuery: Query) => void;
	searchHistory: SearchHistory;
	incremental?: boolean;
}) {
	const [freeTextQuery, setFreeTextQuery] = useState<string>(initialQuery.q);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const onButtonClick = () =>
		setIsPopoverOpen((isPopoverOpen) => !isPopoverOpen);
	const closePopover = () => setIsPopoverOpen(false);

	const debouncedUpdate = useMemo(() => debounce(update, 750), [update]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				update({ q: freeTextQuery });
			}}
		>
			<EuiFieldSearch
				value={freeTextQuery}
				onChange={(e) => {
					const newQuery = e.target.value;
					setFreeTextQuery(newQuery);
					if (incremental) {
						debouncedUpdate({ q: newQuery });
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
						{searchHistory.length === 0 ? (
							<EuiText color="subdued">No search history</EuiText>
						) : (
							<EuiListGroup>
								{searchHistory.map(({ query, resultsCount }) => (
									<EuiButton
										onClick={() => {
											update(query);
											closePopover();
										}}
										key={paramsToQuerystring(query)}
									>
										{paramsToQuerystring(query)}{' '}
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
