import { EuiShowFor } from '@elastic/eui';
import { css } from '@emotion/react';
import { useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { ErrorPrompt } from './ErrorPrompt.tsx';
import { Feed } from './Feed';
import { ItemData } from './ItemData.tsx';
import { ResizableContainer } from './ResizableContainer.tsx';
import { SideNav } from './SideNav/SideNav.tsx';

export const TickerLayout = () => {
	const { config, state } = useSearch();

	const [sideNavIsOpen, setSideNavIsOpen] = useState<boolean>(false);

	const { itemId: selectedItemId } = config;
	const { status } = state;

	return (
		<>
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
			{status == 'error' && <ErrorPrompt errorMessage={state.error} />}
		</>
	);
};
