import { EuiFieldSearch } from '@elastic/eui';
import { useMemo, useState } from 'react';
import { debounce } from './debounce';
import type { Query } from './sharedTypes';
import { type SearchHistory, useSearch } from './useSearch';

export function SearchBox({
	initialQuery,
	update,
	incremental = false,
}: {
	initialQuery: Query;
	update: (query: Query) => void;
	searchHistory: SearchHistory;
	incremental?: boolean;
}) {
	const { config } = useSearch();
	const [freeTextQuery, setFreeTextQuery] = useState<string>(initialQuery.q);

	const debouncedUpdate = useMemo(() => debounce(update, 750), [update]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				update({ ...config.query, q: freeTextQuery });
			}}
		>
			<EuiFieldSearch
				value={freeTextQuery}
				onChange={(e) => {
					const newQuery = e.target.value;
					setFreeTextQuery(newQuery);
					if (incremental) {
						debouncedUpdate({ ...config.query, q: newQuery });
					}
				}}
				aria-label="search wires"
			/>
		</form>
	);
}
