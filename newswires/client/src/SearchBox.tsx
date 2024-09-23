import type { QueryType } from '@elastic/eui';
import { EuiCallOut, EuiSearchBar } from '@elastic/eui';
import { Fragment, useMemo, useState } from 'react';
import { debounce } from './debounce';

export function SearchBox({
	initialQuery,
	update,
	incremental = false,
}: {
	initialQuery: string;
	update: (newQuery: string) => void;
	incremental?: boolean;
}) {
	const [query, setQuery] = useState<QueryType>(initialQuery);
	const [error, setError] = useState<null | Error>(null);

	const debouncedUpdate = useMemo(() => debounce(update, 750), [update]);

	return (
		<Fragment>
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
