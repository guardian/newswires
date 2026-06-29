import { EuiFieldSearch } from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemo, useState } from 'react';
import { StopShortcutPropagationWrapper } from './context/KeyboardShortcutsContext.tsx';
import { debounce } from './debounce';

export function SearchBox({
	currentTextQuery,
	handleTextQueryChange,
}: {
	currentTextQuery: string;
	handleTextQueryChange: (newQuery: string) => void;
}) {
	const [inputValue, setInputValue] = useState<string>('');
	const [isEditing, setIsEditing] = useState<boolean>(false);

	const debouncedUpdate = useMemo(
		() =>
			debounce((newQuery: string) => {
				handleTextQueryChange(newQuery);
				setIsEditing(false);
			}, 2000),
		[handleTextQueryChange],
	);

	return (
		<StopShortcutPropagationWrapper>
			<EuiFieldSearch
				id="searchBox"
				compressed={true}
				value={isEditing ? inputValue : currentTextQuery}
				placeholder="Search stories"
				onChange={(e) => {
					const newQuery = e.target.value;
					setInputValue(newQuery);
					setIsEditing(true);
					debouncedUpdate(newQuery);
				}}
				onBlur={(e) => {
					// cancel the debounced update and immediately update the query when the user leaves the search box
					debouncedUpdate.cancel();
					setIsEditing(false);
					handleTextQueryChange(e.target.value);
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
	);
}
