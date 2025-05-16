import { EuiButtonIcon, EuiPopover } from '@elastic/eui';
import { useState } from 'react';
import { SearchBox } from './SearchBox.tsx';

export const SearchMenu = () => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const togglePopover = () =>
		setIsPopoverOpen((isPopoverOpen) => !isPopoverOpen);

	const closePopover = () => setIsPopoverOpen(false);

	const button = (
		<EuiButtonIcon
			aria-label="New ticker"
			display="base"
			size="s"
			iconType={'search'}
			onClick={togglePopover}
		/>
	);

	return (
		<EuiPopover
			initialFocus="#searchBox"
			button={button}
			isOpen={isPopoverOpen}
			closePopover={closePopover}
			repositionOnScroll={true}
		>
			<SearchBox />
		</EuiPopover>
	);
};
