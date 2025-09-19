import { EuiShowFor } from '@elastic/eui';
import { css } from '@emotion/react';
import { useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { Feed } from './Feed';
import { ItemData } from './ItemData.tsx';
import { ResizableContainer } from './ResizableContainer.tsx';
import { SideNav } from './SideNav/SideNav.tsx';

export const TickerLayout = ({
	errorPromptComponent,
}: {
	errorPromptComponent?: React.ReactNode;
}) => {
	const { config, state } = useSearch();

	const [sideNavIsOpen, setSideNavIsOpen] = useState<boolean>(false);

	const { itemId: selectedItemId } = config;
	const { status } = state;

	return (
		<>
			<div
				css={css`
					height: 100%;
					max-height: 100vh;
					${(status === 'loading' || status === 'error') &&
					'display: flex; align-items: center;'}
					${status === 'loading' && 'background: white;'}
				`}
			>
				<SideNav
					navIsDocked={false}
					sideNavIsOpen={sideNavIsOpen}
					setSideNavIsOpen={setSideNavIsOpen}
				/>
				<h1
					css={css`
						display: none;
					`}
					className="sr-only"
				>
					Newswires
				</h1>
				{status !== 'error' && (
					<>
						<EuiShowFor sizes={['xs', 's']}>
							<ResizableContainer
								Feed={Feed}
								Item={
									selectedItemId ? <ItemData id={selectedItemId} /> : undefined
								}
								directionOverride={'vertical'}
								setSideNavIsOpen={setSideNavIsOpen}
							/>
						</EuiShowFor>
						<EuiShowFor sizes={['m', 'l', 'xl']}>
							<ResizableContainer
								Feed={Feed}
								Item={
									selectedItemId ? <ItemData id={selectedItemId} /> : undefined
								}
								setSideNavIsOpen={setSideNavIsOpen}
							/>
						</EuiShowFor>
					</>
				)}
				{status == 'error' && errorPromptComponent}
			</div>
		</>
	);
};
