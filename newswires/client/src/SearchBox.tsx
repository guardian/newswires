import { EuiFieldSearch } from '@elastic/eui';
import { useEffect, useMemo, useState } from 'react';
import { StopShortcutPropagationWrapper } from './context/KeyboardShortcutsContext.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { debounce } from './debounce';

export function SearchBox() {
	const { config, handleEnterQuery } = useSearch();
	const [freeTextQuery, setFreeTextQuery] = useState<string>('');

	useEffect(() => {
		setFreeTextQuery(config.query.q);
	}, [config.query.q]);

	const debouncedUpdate = useMemo(
		() => debounce(handleEnterQuery, 750),
		[handleEnterQuery],
	);

	return (
		<StopShortcutPropagationWrapper>
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
		</StopShortcutPropagationWrapper>
	);
}
