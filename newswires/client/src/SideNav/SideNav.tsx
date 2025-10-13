import {
	EuiBadge,
	EuiBadgeGroup,
	EuiCallOut,
	EuiCollapsibleNav,
	EuiCollapsibleNavGroup,
	EuiHeaderSectionItemButton,
	EuiIcon,
	EuiListGroup,
	EuiSwitch,
	EuiText,
	EuiTitle,
	useEuiMinBreakpoint,
	useEuiTheme,
	useIsWithinBreakpoints,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useMemo } from 'react';
import { AppTitle } from '../AppTitle.tsx';
import { useSearch } from '../context/SearchContext.tsx';
import { deriveDateMathRangeLabel } from '../dateHelpers.ts';
import { FeedbackContent } from '../FeedbackContent.tsx';
import { presets, sportPresets } from '../presets.ts';
import type { Query } from '../sharedTypes';
import { recognisedSuppliers } from '../suppliers.ts';
import { defaultConfig } from '../urlState.ts';
import { PresetsContextMenu } from './PresetsContextMenu.tsx';
import { SideNavListItem } from './SideNavListItem.tsx';

function decideLabelForQueryBadge(query: Query): string {
	const { supplier, q, preset, categoryCode, dateRange } = query;
	const supplierLabel = supplier?.join(', ') ?? '';
	const categoryCodesLabel = categoryCode?.join(', ') ?? '';
	const qLabel = q.length > 0 ? `"${q}"` : '';
	const presetLabel = preset ? `[${presetName(preset)}]` : '';
	const dateRangeLabel = dateRange
		? deriveDateMathRangeLabel(dateRange.start, dateRange.end)
		: '';

	const labels = [
		presetLabel,
		supplierLabel,
		categoryCodesLabel,
		qLabel,
		dateRangeLabel,
	];

	return labels.filter((label) => label.length > 0).join(' ');
}

function presetName(presetId: string): string | undefined {
	return [...presets, ...sportPresets].find((preset) => preset.id === presetId)
		?.name;
}

export const SideNav = ({
	navIsDocked,
	sideNavIsOpen,
	setSideNavIsOpen,
}: {
	navIsDocked: boolean;
	sideNavIsOpen: boolean;
	setSideNavIsOpen: (isOpen: boolean) => void;
}) => {
	const largeMinBreakpoint = useEuiMinBreakpoint('l');
	const isLargeScreen = useIsWithinBreakpoints(['l']);
	const isExtraSmallScreen = useIsWithinBreakpoints(['xs']);

	const {
		state,
		config,
		handleEnterQuery,
		toggleAutoUpdate,
		activeSuppliers,
		toggleSupplier,
		openTicker,
	} = useSearch();

	const { euiTheme } = useEuiTheme();

	const isPoppedOut = config.ticker;

	const searchHistory = state.successfulQueryHistory;

	const searchHistoryItems = useMemo(
		() =>
			searchHistory.slice(1).map(({ query, resultsCount }) => ({
				label: decideLabelForQueryBadge(query),
				query,
				resultsCount,
			})),
		[searchHistory],
	);

	const suppliers = useMemo(
		() => [
			{
				label: 'All',
				isActive:
					activeSuppliers.length === 0 ||
					activeSuppliers.length === recognisedSuppliers.length,
				onClick: () => handleEnterQuery({ ...config.query, supplier: [] }),
				onTickerClick: () => {
					openTicker({ ...config.query, supplier: [] });
				},
				colour: 'black',
			},
			...recognisedSuppliers.map(({ name, label, colour }) => ({
				label: label === 'Minor' ? 'Minor agencies' : label,
				isActive:
					activeSuppliers.includes(name) || activeSuppliers.length === 0,
				colour: colour,
				onClick: () => toggleSupplier(name),
				onTickerClick: () => {
					openTicker({ ...config.query, supplier: [name] });
				},
			})),
		],
		[activeSuppliers, handleEnterQuery, toggleSupplier, config, openTicker],
	);

	const supplierItems = suppliers.map(
		({ label, colour, isActive, onClick }) => ({
			id: label,
			label,
			onClick,
			isActive,
			colour,
		}),
	);

	useEffect(() => {
		if (isLargeScreen) {
			setSideNavIsOpen(false);
		}
	}, [isLargeScreen, setSideNavIsOpen]);

	return (
		<>
			<EuiCollapsibleNav
				isOpen={sideNavIsOpen}
				isDocked={navIsDocked}
				size={300}
				button={
					!isPoppedOut ? (
						<EuiHeaderSectionItemButton
							aria-label="Toggle main navigation"
							onClick={() => setSideNavIsOpen(!sideNavIsOpen)}
							css={css`
								${largeMinBreakpoint} {
									display: none;
								}
							`}
						>
							<EuiIcon type={'menu'} size="m" aria-hidden="true" />
						</EuiHeaderSectionItemButton>
					) : undefined
				}
				onClose={() => setSideNavIsOpen(false)}
				css={css`
					.hover-only-icon {
						opacity: 0;
						transition: opacity 0.2s ease;
						pointer-events: none;
					}

					.hover-only-icon:hover {
						background-color: rgba(0, 119, 204, 0.1);
						color: rgb(0, 97, 166);
					}

					.euiListGroupItem:hover .hover-only-icon,
					.euiListGroupItem:focus-within .hover-only-icon {
						opacity: 1;
						pointer-events: auto;
					}
				`}
			>
				<div style={{ height: '90%', overflowY: 'auto' }}>
					{(isPoppedOut || isExtraSmallScreen) && (
						<EuiTitle
							size={'s'}
							css={css`
								padding: 7px;
							`}
						>
							<h1>
								<AppTitle />
							</h1>
						</EuiTitle>
					)}
					<EuiCollapsibleNavGroup title="Presets">
						<PresetsContextMenu />
					</EuiCollapsibleNavGroup>
					<EuiCollapsibleNavGroup title={'Suppliers'}>
						<EuiListGroup flush={true} gutterSize="none">
							{supplierItems.map((item) => (
								<SideNavListItem
									key={item.id}
									label={item.label}
									isActive={item.isActive}
									isTopLevel={true}
									handleButtonClick={item.onClick}
									handleSecondaryActionClick={() =>
										openTicker({
											...defaultConfig.query,
											supplier: item.label === 'All' ? [] : [item.id],
										})
									}
									arrowSide={undefined}
									colour={item.colour}
									toggleDraw={() => alert('toggle!')}
								/>
							))}
						</EuiListGroup>
					</EuiCollapsibleNavGroup>
					<EuiCollapsibleNavGroup title={'Search history'}>
						{searchHistoryItems.length === 0 ? (
							<EuiText size="s">{'No history yet'}</EuiText>
						) : (
							<EuiBadgeGroup color="subdued" gutterSize="s">
								{searchHistoryItems.map(({ label, query, resultsCount }) => {
									return (
										<EuiBadge
											key={label}
											color="secondary"
											onClick={() => {
												handleEnterQuery(query);
											}}
											onClickAriaLabel="Apply filters"
										>
											{label}{' '}
											<EuiBadge color="hollow">
												{resultsCount === 30 ? '30+' : resultsCount}
											</EuiBadge>
										</EuiBadge>
									);
								})}
							</EuiBadgeGroup>
						)}
					</EuiCollapsibleNavGroup>
				</div>

				<div style={{ padding: euiTheme.size.m }}>
					<EuiSwitch
						label="Auto-update"
						checked={state.autoUpdate}
						onChange={toggleAutoUpdate}
					/>
				</div>
				<div>
					<EuiCallOut
						title="Newswires Feedback"
						iconType="info"
						color="primary"
					>
						<FeedbackContent />
					</EuiCallOut>
				</div>
			</EuiCollapsibleNav>
		</>
	);
};
