import { EuiFieldSearch } from '@elastic/eui';
import { useMemo, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { debounce } from './debounce';

export function SearchBox() {
	const { config, handleEnterQuery } = useSearch();
	const [freeTextQuery, setFreeTextQuery] = useState<string>(config.query.q);

	const debouncedUpdate = useMemo(
		() => debounce(handleEnterQuery, 750),
		[handleEnterQuery],
	);

	return (
		<EuiFieldSearch
			value={freeTextQuery}
			onChange={(e) => {
				const newQuery = e.target.value;
				setFreeTextQuery(newQuery);
				debouncedUpdate({ ...config.query, q: newQuery });
			}}
			aria-label="search wires"
			style={{ borderRadius: '0', border: 'none' }}
		/>
	);
}
