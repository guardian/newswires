import {
	EuiBetaBadge,
	EuiButton,
	EuiButtonEmpty,
	EuiEmptyPrompt,
	EuiFlexGroup,
	EuiHeader,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiIcon,
	EuiLink,
	EuiModal,
	EuiModalBody,
	EuiModalFooter,
	EuiModalHeader,
	EuiModalHeaderTitle,
	EuiPageTemplate,
	EuiProvider,
	EuiResizableContainer,
	EuiShowFor,
	EuiText,
	EuiTitle,
	EuiToast,
	useIsWithinMinBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useState } from 'react';
import { z } from 'zod';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './context/localStorage.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { useUserSettings } from './context/UserSettingsContext.tsx';
import { isRestricted } from './dateHelpers.ts';
import { Feed } from './Feed';
import { FeedbackContent } from './FeedbackContent.tsx';
import { ItemData } from './ItemData.tsx';
import { SettingsMenu } from './SettingsMenu.tsx';
import { SideNav } from './SideNav';
import { configToUrl, defaultQuery } from './urlState';

const Alert = ({
	title,
	icon = 'warning',
}: {
	title: string;
	icon?: string;
}) => {
	const isOnLargerScreen = useIsWithinMinBreakpoint('l');

	return (
		<div
			css={css`
				.euiToast.header-only span {
					font-weight: 500;
					font-size: 1rem;
				}

				.euiToast.header-only svg {
					top: 2px;
				}
			`}
		>
			<EuiToast
				title={title}
				iconType={icon}
				className={'header-only'}
				css={css`
					padding: 8px;
					border-radius: 0;
					background: #fdf6d8;
					position: fixed;
					z-index: 1000;
					${isOnLargerScreen && 'width: calc(100% - 300px)'}
				`}
			></EuiToast>
		</div>
	);
};

const ResizableContainer = ({
	Feed,
	Item,
}: {
	Feed: React.ReactNode;
	Item: React.ReactNode;
}) => {
	const firstPanelId = 'firstResizablePanel';
	const secondPanelId = 'secondResizablePanel';

	const { resizablePanelsDirection } = useUserSettings();

	const [sizes, setSizes] = useState<{
		[firstPanelId]: number;
		[secondPanelId]: number;
	}>(() =>
		loadOrSetInLocalStorage(
			'resizablePanelSizes',
			z.object({ [firstPanelId]: z.number(), [secondPanelId]: z.number() }),
			{ [firstPanelId]: 50, [secondPanelId]: 50 },
		),
	);

	return (
		<EuiResizableContainer
			className="eui-fullHeight"
			direction={resizablePanelsDirection}
			onPanelWidthChange={(newSizes) => {
				console.log('newSizes', JSON.stringify(newSizes));
				saveToLocalStorage('resizablePanelSizes', newSizes);
				setSizes((prevSizes) => ({ ...prevSizes, ...newSizes }));
			}}
		>
			{(EuiResizablePanel, EuiResizableButton) => (
				<>
					<EuiResizablePanel
						id={firstPanelId}
						minSize="20%"
						initialSize={sizes[firstPanelId]}
						className="eui-yScroll"
						style={{ padding: 0 }}
					>
						{Feed}
					</EuiResizablePanel>
					<EuiResizableButton accountForScrollbars={'before'} />
					<EuiResizablePanel
						id={secondPanelId}
						minSize="20%"
						initialSize={sizes[secondPanelId]}
						className="eui-yScroll"
					>
						{Item}
					</EuiResizablePanel>
				</>
			)}
		</EuiResizableContainer>
	);
};

export function App() {
	const {
		config,
		state,
		handleEnterQuery,
		handleRetry,
		handleDeselectItem,
		handleNextItem,
		handlePreviousItem,
	} = useSearch();

	const [displayDisclaimer, setDisplayDisclaimer] = useState<boolean>(() =>
		loadOrSetInLocalStorage<boolean>('displayDisclaimer', z.boolean(), true),
	);

	const { view, itemId: selectedItemId, query } = config;
	const { status } = state;

	const isPoppedOut = !!window.opener;

	const dismissDisclaimer = (persist?: boolean) => {
		setDisplayDisclaimer(false);
		if (persist) {
			saveToLocalStorage<boolean>('displayDisclaimer', false);
		}
	};

	const breakpoints = {
		sm: '@media (max-width: 600px)',
		md: '@media (min-width: 900px)',
	};

	return (
		<EuiProvider colorMode="light">
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
					height: 100vh;
				`}
			>
				{displayDisclaimer && (
					<EuiModal
						aria-labelledby="disclaimer-title"
						onClose={() => dismissDisclaimer()}
					>
						<EuiModalHeader>
							<EuiModalHeaderTitle
								title={'Please use with caution'}
								id="disclaimer-title"
							>
								<EuiIcon type="iInCircle" size="xl" /> Please use with caution
							</EuiModalHeaderTitle>
						</EuiModalHeader>

						<EuiModalBody>
							<EuiText size="m">
								Please be advised that this product is currently in its early
								testing phase, under active development, and subject to change.
								<br />
								<FeedbackContent />
							</EuiText>
						</EuiModalBody>

						<EuiModalFooter>
							<EuiButtonEmpty onClick={() => dismissDisclaimer()}>
								Close
							</EuiButtonEmpty>
							<EuiButton onClick={() => dismissDisclaimer(true)} fill>
								Don&apos;t show again
							</EuiButton>
						</EuiModalFooter>
					</EuiModal>
				)}
				{status === 'offline' && (
					<Alert
						title="The application is no longer retrieving updates. Data
                        synchronization will resume once connectivity is restored."
					/>
				)}
				{isRestricted(query.dateRange?.end) &&
					status !== 'offline' &&
					status !== 'error' && (
						<Alert
							title="Your current filter settings exclude recent updates. Adjust the
							filter to see the latest data."
						/>
					)}
				<div
					css={css`
						${(status === 'offline' || isRestricted(query.dateRange?.end)) &&
						`padding-top: 40px;
						  ${breakpoints.sm} {
							padding-top: 72px;
						  }
						`}
						height: 100%;
						max-height: 100vh;
						${(status === 'loading' || status === 'error') &&
						'display: flex; align-items: center;'}
						${status === 'loading' && 'background: white;'}
					`}
				>
					{!isPoppedOut && (
						<EuiHeader position="fixed">
							<EuiHeaderSection>
								<EuiHeaderSectionItem>
									<SideNav />
								</EuiHeaderSectionItem>
								<EuiHeaderSectionItem>
									<EuiTitle
										size={'s'}
										css={css`
											padding-bottom: 3px;
										`}
									>
										<h1>
											<EuiLink
												href="/feed"
												external={false}
												css={css`
													color: inherit;
													font-weight: inherit;
												`}
											>
												Newswires
											</EuiLink>
											<EuiBetaBadge
												label="Under construction"
												color={'accent'}
												size="s"
												css={css`
													margin-left: 8px;
												`}
											></EuiBetaBadge>
										</h1>
									</EuiTitle>
								</EuiHeaderSectionItem>
							</EuiHeaderSection>

							<EuiHeaderSectionItem>
								<EuiFlexGroup
									gutterSize="xs"
									css={css`
										margin-left: 8px;
									`}
								>
									<EuiButton
										size="s"
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
									>
										New ticker
									</EuiButton>
									<SettingsMenu />
								</EuiFlexGroup>
							</EuiHeaderSectionItem>
						</EuiHeader>
					)}
					{status !== 'error' && (
						<>
							<EuiShowFor sizes={['xs', 's']}>
								{view === 'item' &&
									(isPoppedOut ? (
										<ResizableContainer
											Feed={<Feed />}
											Item={<ItemData id={selectedItemId} />}
										/>
									) : (
										<ItemData id={selectedItemId} />
									))}
								{view !== 'item' && <Feed />}
							</EuiShowFor>
							<EuiShowFor sizes={['m', 'l', 'xl']}>
								{view === 'item' ? (
									<ResizableContainer
										Feed={<Feed />}
										Item={<ItemData id={selectedItemId} />}
									/>
								) : (
									<Feed />
								)}
							</EuiShowFor>
						</>
					)}
					{status == 'error' && (
						<EuiEmptyPrompt
							css={css`
								background: white;
							`}
							actions={[
								<EuiButton
									onClick={handleRetry}
									key="retry"
									iconType={'refresh'}
								>
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
				</div>
			</EuiPageTemplate>
		</EuiProvider>
	);
}
