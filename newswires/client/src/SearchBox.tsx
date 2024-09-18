import type { QueryType } from '@elastic/eui';
import { EuiCallOut, EuiSearchBar } from '@elastic/eui';
import { Fragment, useState } from 'react';

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
						update(query.text);
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
