import { EuiFieldSearch } from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';
import { StopShortcutPropagationWrapper } from './context/KeyboardShortcutsContext.tsx';
import { debounce } from './debounce';
import { SupplierFilterGroup } from './SupplierFilterGroup.tsx';

export function SearchBox({
	currentTextQuery,
	handleTextQueryChange,
}: {
	currentTextQuery: string;
	handleTextQueryChange: (newQuery: string) => void;
}) {
	const [inputValue, setInputValue] = useState<string>('');

	useEffect(() => {
		setInputValue(currentTextQuery);
	}, [currentTextQuery]);

	const debouncedUpdate = useMemo(
		() => debounce(handleTextQueryChange, 750),
		[handleTextQueryChange],
	);

	return (
		<>
			<SupplierFilterGroup />
			<StopShortcutPropagationWrapper>
				<EuiFieldSearch
					id="searchBox"
					compressed={true}
					value={inputValue}
					placeholder="Search stories"
					onChange={(e) => {
						const newQuery = e.target.value;
						setInputValue(newQuery);
						debouncedUpdate(newQuery);
					}}
					aria-label="search wires"
					fullWidth={true}
					css={css`
						border: none;
						background-color: #edf1f8;
						transition: background-color 0.2s ease;

						&:focus {
							background-color: #ffffff;
						}
					`}
				/>
			</StopShortcutPropagationWrapper>
		</>
	);
}
