import { EuiFieldSearch } from '@elastic/eui';
import { css } from '@emotion/react';
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
				id="searchBox"
				compressed={true}
				value={freeTextQuery}
				placeholder="Search stories"
				onChange={(e) => {
					const newQuery = e.target.value;
					setFreeTextQuery(newQuery);
					debouncedUpdate({ ...config.query, q: newQuery });
				}}
				aria-label="search wires"
				fullWidth={true}
				css={css`
					border: none;
					background-color: #edf1f8;
					transition: background-color 0.2s ease;
					max-width: 580px;

					&:focus {
						background-color: #ffffff;
					}
				`}
			/>
		</StopShortcutPropagationWrapper>
	);
}
