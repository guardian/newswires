import type { MouseEventHandler } from 'react';
import { useCallback } from 'react';
import { useSearch } from './context/SearchContext';
import { configToUrl } from './urlState';

export const Link = ({
	children,
	to,
	...props
}: {
	children: React.ReactNode;
	to: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
	const { handleSelectItem, config } = useSearch();
	const href = configToUrl({ ...config, itemId: to });

	const onClick: MouseEventHandler<HTMLAnchorElement> = useCallback(
		(e) => {
			if (!(e.getModifierState('Meta') || e.getModifierState('Control'))) {
				e.preventDefault();
				handleSelectItem(to);
			}
		},
		[to, handleSelectItem],
	);

	return (
		<a href={href} onClick={onClick} {...props}>
			{children}
		</a>
	);
};
