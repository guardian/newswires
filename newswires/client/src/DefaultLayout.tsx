import {
	EuiButton,
	EuiButtonIcon,
	EuiFlexGroup,
	EuiHeader,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiHeaderSectionItemButton,
	EuiIcon,
	EuiScreenReaderOnly,
	EuiShowFor,
	EuiTitle,
	useEuiMaxBreakpoint,
	useEuiMinBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useCallback, useState } from 'react';
import { AppTitle } from './AppTitle.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { ErrorPrompt } from './ErrorPrompt.tsx';
import { Feed } from './Feed';
import { ItemData } from './ItemData.tsx';
import { ResizableContainer } from './ResizableContainer.tsx';
import { SearchBox } from './SearchBox.tsx';
import { SettingsMenu } from './SettingsMenu.tsx';
import { SideNav } from './SideNav/SideNav.tsx';
import { Tooltip } from './Tooltip.tsx';

export function DefaultLayout() {
	const { config, state, handleEnterQuery, openTicker } = useSearch();

	const [sideNavIsOpen, setSideNavIsOpen] = useState<boolean>(false);

	const [sideNavIsDocked, setSideNavIsDocked] = useState<boolean>(true);

	const handleTextQueryChange = useCallback(
		(newQuery: string) => {
			handleEnterQuery({ ...config.query, q: newQuery });
		},
		[config.query, handleEnterQuery],
	);

	const { view, itemId: selectedItemId } = config;
	const { status } = state;

	const largeMinBreakpoint = useEuiMinBreakpoint('l');
	const largeMaxBreakpoint = useEuiMaxBreakpoint('l');

	return (
		<>
			<EuiHeader position="fixed">
				<EuiHeaderSection side={'left'}>
					<EuiHeaderSectionItem>
						<EuiHeaderSectionItemButton
							aria-label="Toggle main navigation"
							onClick={() => setSideNavIsDocked((isDocked) => !isDocked)}
							css={css`
								${largeMaxBreakpoint} {
									display: none;
								}
							`}
						>
							<EuiIcon type={'menu'} size="m" aria-hidden="true" />
						</EuiHeaderSectionItemButton>
						<SideNav
							navIsDocked={sideNavIsDocked}
							sideNavIsOpen={sideNavIsOpen}
							setSideNavIsOpen={setSideNavIsOpen}
						/>
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
				</EuiHeaderSection>
			</EuiHeader>
			{status !== 'error' && (
				<>
					<EuiShowFor sizes={['xs', 's']}>
						{view === 'item' && <ItemData id={selectedItemId} />}
						{view !== 'item' && (
							<div className="eui-fullHeight">
								<div className="eui-yScroll">
									<Feed setSideNavIsOpen={setSideNavIsOpen} />
								</div>
							</div>
						)}
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
}
