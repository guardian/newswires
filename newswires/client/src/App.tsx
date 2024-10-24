import {
	EuiButton,
	EuiButtonIcon,
	EuiContextMenu,
	EuiEmptyPrompt,
	EuiHeader,
	EuiHeaderLinks,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiPageTemplate,
	EuiPopover,
	EuiProvider,
	EuiResizableContainer,
	EuiShowFor,
	EuiSwitch,
	EuiTitle,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useState } from 'react';
import { Feed } from './Feed';
import { Item } from './Item';
import { SideNav } from './SideNav';
import { configToUrl, defaultQuery } from './urlState';
import { useSearch } from './useSearch';

export function App() {
	const {
		config,
		state,
		handleEnterQuery,
		handleRetry,
		handleDeselectItem,
		handleNextItem,
		handlePreviousItem,
		toggleAutoUpdate,
	} = useSearch();

	const [colourMode, setColourMode] = useState<'light' | 'dark'>('light');

	const toggleColourMode = () => {
		setColourMode(colourMode === 'light' ? 'dark' : 'light');
	};
	const contextMenuPopoverId = useGeneratedHtmlId();
	const panels = [
		{
			id: 0,
			title: 'Options',
			items: [
				{
					name: 'Dark mode',
					icon: (
						<EuiSwitch
							checked={colourMode === 'dark'}
							onChange={toggleColourMode}
							label={undefined}
						/>
					),
				},
				{
					name: 'Auto update',
					icon: (
						<EuiSwitch
							checked={state.autoUpdate}
							onChange={toggleAutoUpdate}
							label={undefined}
						/>
					),
				},
			],
		},
	];
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const button = (
		<EuiButtonIcon
			aria-label="settings"
			iconType="gear"
			onClick={() => setIsPopoverOpen(!isPopoverOpen)}
			color="primary"
			display="base"
			size="m"
		/>
	);

	const { view, itemId: selectedItemId } = config;
	const { status } = state;

	const isPoppedOut = !!window.opener;

	return (
		<EuiProvider
			colorMode={colourMode}
			modify={{
				colors: {
					LIGHT: {
						primary: '#61c3d9',
						accent: '#006D67',
						success: '#bdd000',
						warning: '#ffb910',
						danger: '#c70000',
					},
				},
			}}
		>
			<EuiPageTemplate
				onKeyUp={(e) => {
					if (view == 'item') {
						switch (e.key) {
							case 'Escape':
								handleDeselectItem();
								break;
							case 'ArrowLeft':
								handlePreviousItem();
								break;
							case 'ArrowRight':
								handleNextItem();
								break;
						}
					}
				}}
				css={css`
					max-height: 100vh;
				`}
			>
				{!isPoppedOut ? (
					<EuiHeader position="fixed">
						<EuiHeaderSection>
							<EuiHeaderSectionItem>
								<EuiTitle
									size={'s'}
									css={css`
										padding-bottom: 3px;
										padding-right: 10px;
									`}
								>
									<h1>Newswires</h1>
								</EuiTitle>
							</EuiHeaderSectionItem>
							<EuiHeaderSectionItem>
								<SideNav dockedByDefault={true} />
							</EuiHeaderSectionItem>
						</EuiHeaderSection>
						<EuiHeaderLinks>
							<EuiButtonIcon
								iconType={'popout'}
								onClick={() =>
									window.open(
										configToUrl({
											...config,
											view: 'feed',
											itemId: undefined,
										}),
										'_blank',
										'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no',
									)
								}
								color="primary"
								display="base"
								size="m"
								aria-label="popout search in new ticker window"
							>
								New ticker
							</EuiButtonIcon>
							<EuiPopover
								id={contextMenuPopoverId}
								button={button}
								isOpen={isPopoverOpen}
								closePopover={() => setIsPopoverOpen(false)}
								panelPaddingSize="none"
								anchorPosition="downLeft"
							>
								<EuiContextMenu initialPanelId={0} panels={panels} />
							</EuiPopover>
						</EuiHeaderLinks>
					</EuiHeader>
				) : (
					<div
						css={css`
							position: fixed;
							top: 10px;
							left: 10px;
						`}
					>
						<SideNav dockedByDefault={false} />
					</div>
				)}
				{status !== 'error' && (
					<>
						<EuiShowFor sizes={['xs', 's']}>
							{view === 'item' ? <Item id={selectedItemId} /> : <Feed />}
						</EuiShowFor>
						<EuiShowFor sizes={['m', 'l', 'xl']}>
							{view === 'item' ? (
								<EuiResizableContainer className="eui-fullHeight">
									{(EuiResizablePanel, EuiResizableButton) => (
										<>
											<EuiResizablePanel
												minSize="25%"
												initialSize={100}
												className="eui-yScroll"
												paddingSize="xs"
											>
												<Feed />
											</EuiResizablePanel>
											<EuiResizableButton />
											<EuiResizablePanel
												minSize="30%"
												initialSize={100}
												className="eui-yScroll"
												paddingSize="s"
											>
												<Item id={selectedItemId} />
											</EuiResizablePanel>
										</>
									)}
								</EuiResizableContainer>
							) : (
								<Feed />
							)}
						</EuiShowFor>
					</>
				)}
				{status == 'error' && (
					<EuiEmptyPrompt
						actions={[
							<EuiButton onClick={handleRetry} key="retry" iconType={'refresh'}>
								Retry
							</EuiButton>,
							<EuiButton
								onClick={() => handleEnterQuery(defaultQuery)}
								key="clear"
								iconType={'cross'}
							>
								Clear
							</EuiButton>,
						]}
						body={<p>Sorry, failed to load because of {state.error}</p>}
						hasBorder={true}
					/>
				)}
			</EuiPageTemplate>
		</EuiProvider>
	);
}
