import { EuiFieldSearch, EuiForm } from '@elastic/eui';
import { useMemo, useState } from 'react';
import { debounce } from './debounce';
import { useSearch } from './useSearch';

export function SearchBox({ incremental = false }: { incremental?: boolean }) {
	const { config, handleEnterQuery } = useSearch();
	const [freeTextQuery, setFreeTextQuery] = useState<string>(config.query.q);

	const debouncedUpdate = useMemo(
		() => debounce(handleEnterQuery, 750),
		[handleEnterQuery],
	);

	return (
		<EuiForm
			onSubmit={(e) => {
				e.preventDefault();
				handleEnterQuery({ ...config.query, q: freeTextQuery });
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
				style={{ borderRadius: '0', border: 'none' }}
			/>
		</EuiForm>
	);
}
