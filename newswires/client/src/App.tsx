import {
	EuiBetaBadge,
	EuiButton,
	EuiButtonEmpty,
	EuiButtonIcon,
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
import { isRestricted } from './dateHelpers.ts';
import { Feed } from './Feed';
import { FeedbackContent } from './FeedbackContent.tsx';
import { ItemData } from './ItemData.tsx';
import { isOpenAsTicker, openTicker } from './openTicker.ts';
import { ResizableContainer } from './ResizableContainer.tsx';
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

	const isPoppedOut = isOpenAsTicker();

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
											<EuiShowFor sizes={['xs', 's']}>
												<EuiBetaBadge
													iconType={'beaker'}
													label="Currently under construction"
													aria-label="(Under construction)"
													color={'accent'}
													size="m"
													css={css`
														margin-left: 8px;
													`}
												/>
											</EuiShowFor>
											<EuiShowFor sizes={['m', 'l', 'xl']}>
												<EuiBetaBadge
													label="Under construction"
													aria-label="(Under construction)"
													title="Currently under construction"
													color={'accent'}
													size="s"
													css={css`
														margin-left: 8px;
													`}
												/>
											</EuiShowFor>
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
									<EuiShowFor sizes={['xs', 's']}>
										<Tooltip tooltipContent={'Open new ticker'} position="left">
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
								{view === 'item' &&
									(isPoppedOut ? (
										<ResizableContainer
											Feed={<Feed />}
											Item={<ItemData id={selectedItemId} />}
											directionOverride={'vertical'}
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
