import {
	EuiButton,
	EuiButtonEmpty,
	EuiButtonIcon,
	EuiEmptyPrompt,
	EuiFlexGroup,
	EuiHeader,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiHeaderSectionItemButton,
	EuiIcon,
	EuiModal,
	EuiModalBody,
	EuiModalFooter,
	EuiModalHeader,
	EuiModalHeaderTitle,
	EuiPageTemplate,
	EuiProvider,
	EuiScreenReaderOnly,
	EuiShowFor,
	EuiText,
	EuiTitle,
	EuiToast,
	useEuiMaxBreakpoint,
	useEuiMinBreakpoint,
	useIsWithinMinBreakpoint,
} from '@elastic/eui';
import { css, Global } from '@emotion/react';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod/v4';
import { STAGE } from './app-configuration.ts';
import { AppTitle } from './AppTitle.tsx';
import { useKeyboardShortcuts } from './context/KeyboardShortcutsContext.tsx';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './context/localStorage.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { isRestricted } from './dateHelpers.ts';
import { Feed } from './Feed';
import { fontStyles } from './fontStyles.ts';
import { ItemData } from './ItemData.tsx';
import { presetLabel } from './presets.ts';
import { ResizableContainer } from './ResizableContainer.tsx';
import { SearchBox } from './SearchBox.tsx';
import { SettingsMenu } from './SettingsMenu.tsx';
import { SideNav } from './SideNav';
import { TelemetryPixel } from './TelemetryPixel.tsx';
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
		openTicker,
		sideNavIsOpen,
	} = useSearch();

	const [sideNavIsDocked, setSideNavIsDocked] = useState<boolean>(true);
	const [displayDisclaimer, setDisplayDisclaimer] = useState<boolean>(() =>
		loadOrSetInLocalStorage<boolean>('displayDisclaimer', z.boolean(), true),
	);
	const handleTextQueryChange = useCallback(
		(newQuery: string) => {
			handleEnterQuery({ ...config.query, q: newQuery });
		},
		[config.query, handleEnterQuery],
	);

	const { handleShortcutKeyUp } = useKeyboardShortcuts();

	const { view, itemId: selectedItemId, query } = config;
	const { status } = state;

	const isPoppedOut = config.ticker;

	const dismissDisclaimer = (persist?: boolean) => {
		setDisplayDisclaimer(false);
		if (persist) {
			saveToLocalStorage<boolean>('displayDisclaimer', false);
		}
	};

	useEffect(() => {
		function shortcutKeyHandler(event: KeyboardEvent) {
			void handleShortcutKeyUp(event);
		}

		window.addEventListener('keyup', shortcutKeyHandler);

		return () => {
			window.removeEventListener('keyup', shortcutKeyHandler);
		};
	}, [handleShortcutKeyUp]);

	useEffect(() => {
		const { preset, supplier } = config.query;

		const displayPreset = !!preset;
		const displaySuppliers = !!supplier && supplier.length > 0;

		if (displayPreset || displaySuppliers) {
			const newswiresPrefix = !isPoppedOut ? 'Newswires -- ' : '';
			const titlePrefix = supplier!.length == 1 ? `${supplier![0]} ` : '';
			const titlePostfix =
				supplier!.length > 1 ? ` ${supplier!.join(', ')}` : '';

			document.title = `${newswiresPrefix}${titlePrefix}${preset ? `${presetLabel(preset).toUpperCase()}` : ''}${titlePostfix}`;
		} else {
			document.title = 'Newswires';
		}
	}, [isPoppedOut, config.query]);

	const largeMinBreakpoint = useEuiMinBreakpoint('l');
	const largeMaxBreakpoint = useEuiMaxBreakpoint('l');
	const smallMinBreakpoint = useEuiMinBreakpoint('s');

	return (
		<>
			<Global styles={fontStyles} />

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
									title={'Newswires is ready to use'}
									id="disclaimer-title"
								>
									Newswires is ready to use
								</EuiModalHeaderTitle>
							</EuiModalHeader>

							<EuiModalBody>
								<EuiText size="m">
									You&apos;re using an early version of Newswires. It&apos;s
									fully available, with ongoing improvments. Join the{' '}
									<a
										href="https://chat.google.com/room/AAQASNVMF_A?cls=7"
										target="_blank"
										rel="noreferrer"
									>
										chat group
									</a>{' '}
									to keep up to date
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
						{isPoppedOut && <SideNav navIsDocked={false} />}
						{!isPoppedOut && (
							<EuiHeader position="fixed">
								<EuiHeaderSection side={'left'}>
									<TelemetryPixel stage={STAGE} />
									<EuiHeaderSectionItem>
										<EuiHeaderSectionItemButton
											aria-label="Toggle main navigation"
											onClick={() =>
												setSideNavIsDocked((isDocked) => !isDocked)
											}
											css={css`
												${largeMaxBreakpoint} {
													display: none;
												}
											`}
										>
											<EuiIcon type={'menu'} size="m" aria-hidden="true" />
										</EuiHeaderSectionItemButton>
										<SideNav navIsDocked={sideNavIsDocked} />
									</EuiHeaderSectionItem>
									<EuiShowFor sizes={['xs']}>
										{!sideNavIsOpen && (
											<EuiScreenReaderOnly>
												<h1>
													<AppTitle />
												</h1>
											</EuiScreenReaderOnly>
										)}
									</EuiShowFor>
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
														width: 258px;
													}
												`}
											>
												<h1>
													<AppTitle />
												</h1>
											</EuiTitle>
										</EuiHeaderSectionItem>
									</EuiShowFor>
								</EuiHeaderSection>

								<EuiHeaderSection grow={true}>
									<EuiHeaderSectionItem
										css={css`
											flex: 1 1 100%;
											max-width: 580px;
										`}
									>
										<SearchBox
											currentTextQuery={config.query.q}
											handleTextQueryChange={handleTextQueryChange}
										/>
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
		</>
	);
}
