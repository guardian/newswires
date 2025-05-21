import {
	EuiButton,
	EuiButtonEmpty,
	EuiButtonIcon,
	EuiEmptyPrompt,
	EuiFlexGroup,
	EuiHeader,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiIcon,
	EuiModal,
	EuiModalBody,
	EuiModalFooter,
	EuiModalHeader,
	EuiModalHeaderTitle,
	EuiPageTemplate,
	EuiProvider,
	EuiShowFor,
	EuiText,
	EuiTitle,
	EuiToast,
	useEuiMaxBreakpoint,
	useEuiMinBreakpoint,
	useIsWithinMinBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { AppTitle } from './AppTitle.tsx';
import { BetaBadge } from './BetaBadge.tsx';
import { useKeyboardShortcuts } from './context/KeyboardShortcutsContext.tsx';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './context/localStorage.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { isRestricted } from './dateHelpers.ts';
import { Feed } from './Feed';
import { FeedbackContent } from './FeedbackContent.tsx';
import { ItemData } from './ItemData.tsx';
import { isOpenAsTicker, openTicker } from './openTicker.ts';
import { ResizableContainer } from './ResizableContainer.tsx';
import { SearchBox } from './SearchBox.tsx';
import { SettingsMenu } from './SettingsMenu.tsx';
import { SideNav } from './SideNav';
import { Tooltip } from './Tooltip.tsx';
import { defaultQuery } from './urlState';

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

export function App() {
	const { config, state, handleEnterQuery, handleRetry } = useSearch();

	const [displayDisclaimer, setDisplayDisclaimer] = useState<boolean>(() =>
		loadOrSetInLocalStorage<boolean>('displayDisclaimer', z.boolean(), true),
	);

	const { handleShortcutKeyUp } = useKeyboardShortcuts();

	const { view, itemId: selectedItemId, query } = config;
	const { status } = state;

	const isPoppedOut = isOpenAsTicker();

	const dismissDisclaimer = (persist?: boolean) => {
		setDisplayDisclaimer(false);
		if (persist) {
			saveToLocalStorage<boolean>('displayDisclaimer', false);
		}
	};

	useEffect(() => {
		window.addEventListener('keyup', handleShortcutKeyUp);

		return () => {
			window.removeEventListener('keyup', handleShortcutKeyUp);
		};
	}, [handleShortcutKeyUp]);

	const largeMinBreakpoint = useEuiMinBreakpoint('l');
	const largeMaxBreakpoint = useEuiMaxBreakpoint('l');
	const smallMinBreakpoint = useEuiMinBreakpoint('s');

	return (
		<EuiProvider colorMode="light">
			<EuiPageTemplate
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
						  ${smallMinBreakpoint} {
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
							<EuiHeaderSection side={'left'}>
								<EuiHeaderSectionItem>
									<SideNav />
								</EuiHeaderSectionItem>
								<EuiShowFor sizes={['s', 'm', 'l', 'xl']}>
									<EuiHeaderSectionItem>
										<EuiTitle
											size={'s'}
											css={css`
												padding-bottom: 3px;
												${largeMaxBreakpoint} {
													margin-right: 8px;
												}
												${largeMinBreakpoint} {
													width: 298px;
												}
											`}
										>
											<h1>
												<AppTitle />
												<EuiShowFor sizes={['xs', 's']}>
													<BetaBadge size={'small'} />
												</EuiShowFor>
												<EuiShowFor sizes={['m', 'l', 'xl']}>
													<BetaBadge size={'medium'} />
												</EuiShowFor>
											</h1>
										</EuiTitle>
									</EuiHeaderSectionItem>
								</EuiShowFor>
							</EuiHeaderSection>

							<EuiHeaderSection grow={true}>
								<EuiHeaderSectionItem
									css={css`
										flex: 1 1 100%;
									`}
								>
									<SearchBox />
								</EuiHeaderSectionItem>
							</EuiHeaderSection>

							<EuiHeaderSection side={'right'}>
								<EuiHeaderSectionItem>
									<EuiFlexGroup
										gutterSize="xs"
										css={css`
											margin-left: 8px;
										`}
									>
										<EuiShowFor sizes={['xs', 's']}>
											<Tooltip
												tooltipContent={'Open new ticker'}
												position="left"
											>
												<EuiButtonIcon
													aria-label="New ticker"
													display="base"
													size="s"
													iconType={'popout'}
													onClick={() => openTicker(config.query)}
												/>
											</Tooltip>
										</EuiShowFor>
										<EuiShowFor sizes={['m', 'l', 'xl']}>
											<EuiButton
												size="s"
												iconType={'popout'}
												onClick={() => openTicker(config.query)}
											>
												New ticker
											</EuiButton>
										</EuiShowFor>
										<SettingsMenu />
									</EuiFlexGroup>
								</EuiHeaderSectionItem>
							</EuiHeaderSection>
						</EuiHeader>
					)}
					{isPoppedOut && (
						<h1
							css={css`
								display: none;
							`}
							className="sr-only"
						>
							Newswires
						</h1>
					)}
					{status !== 'error' && (
						<>
							<EuiShowFor sizes={['xs', 's']}>
								{isPoppedOut && (
									<ResizableContainer
										Feed={Feed}
										Item={
											selectedItemId ? (
												<ItemData id={selectedItemId} />
											) : undefined
										}
										directionOverride={'vertical'}
									/>
								)}

								{view === 'item' && !isPoppedOut && (
									<ItemData id={selectedItemId} />
								)}

								{view !== 'item' && !isPoppedOut && <Feed />}
							</EuiShowFor>
							<EuiShowFor sizes={['m', 'l', 'xl']}>
								<ResizableContainer
									Feed={Feed}
									Item={
										selectedItemId ? (
											<ItemData id={selectedItemId} />
										) : undefined
									}
								/>
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
