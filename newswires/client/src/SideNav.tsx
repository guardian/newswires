import type { EuiPinnableListGroupItemProps } from '@elastic/eui';
import {
	EuiBadge,
	EuiBadgeGroup,
	EuiCallOut,
	EuiCollapsibleNav,
	EuiCollapsibleNavGroup,
	EuiHeaderSectionItemButton,
	EuiIcon,
	EuiPinnableListGroup,
	EuiSwitch,
	EuiText,
	EuiTitle,
	useEuiMinBreakpoint,
	useEuiTheme,
	useIsWithinBreakpoints,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useMemo } from 'react';
import { AppTitle } from './AppTitle.tsx';
import { BetaBadge } from './BetaBadge.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { deriveDateMathRangeLabel } from './dateHelpers.ts';
import { FeedbackContent } from './FeedbackContent.tsx';
import { presets } from './presets.ts';
import type { Query } from './sharedTypes';
import { recognisedSuppliers } from './suppliers.ts';

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
	return presets.find((preset) => preset.id === presetId)?.name;
}

export const SideNav = ({ navIsDocked }: { navIsDocked: boolean }) => {
	const largeMinBreakpoint = useEuiMinBreakpoint('l');
	const isLargeScreen = useIsWithinBreakpoints(['l']);
	const isExtraSmallScreen = useIsWithinBreakpoints(['xs']);
	const theme = useEuiTheme();

	const {
		state,
		config,
		handleEnterQuery,
		toggleAutoUpdate,
		activeSuppliers,
		toggleSupplier,
		openTicker,
		sideNavIsOpen: navIsOpen,
		setSideNavIsOpen: setNavIsOpen,
	} = useSearch();

	const isPoppedOut = config.ticker;

	const searchHistory = state.successfulQueryHistory;

	const activePreset = config.query.preset;

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
				label: 'All suppliers',
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

	const presetItems = useMemo(() => {
		const togglePreset = (preset: string) =>
			activePreset === preset || preset === 'all-presets' ? undefined : preset;

		return presets.map(({ id: presetId, name, filterOptions }) => {
			const isActive =
				activePreset === presetId ||
				!!filterOptions.find((_) => _.id === activePreset) ||
				(presetId === 'all-presets' && !activePreset);

			return {
				id: presetId,
				label: name,
				isActive: isActive,
				onClick: () =>
					handleEnterQuery({
						...config.query,
						preset: togglePreset(presetId),
					}),
				iconType: () => (
					<div
						css={css`
							width: 1rem;
							height: 1rem;
							border-radius: 50%;

							margin-right: 12px;
							border: 2px solid ${theme.euiTheme.colors.primary};
							background-color: ${isActive
								? theme.euiTheme.colors.primary
								: 'transparent'};
						`}
					/>
				),
				color: isActive ? 'primary' : 'subdued',
				pinnable: false,
				extraAction: {
					iconType: 'popout', // EUI icon on the right
					onClick: () => {
						openTicker({ ...config.query, preset: presetId });
					},
					'aria-label': 'More info',
					alwaysShow: false,
					className: 'hover-only-icon',
				},
			};
		}) as EuiPinnableListGroupItemProps[];
	}, [
		activePreset,
		config,
		handleEnterQuery,
		openTicker,
		theme.euiTheme.colors.primary,
	]);

	const supplierItems: EuiPinnableListGroupItemProps[] = suppliers.map(
		({ label, colour, isActive, onClick, onTickerClick }, index) => ({
			id: label,
			label,
			onClick,
			isActive,
			iconType: () => (
				<>
					{index > 0 && (
						<div
							css={css`
								width: calc(12px + 1rem);
							`}
						></div>
					)}
					<div
						css={css`
							width: 1rem;
							height: 1rem;

							margin-right: 12px;
							border: 2px solid ${colour};
							color: ${isActive ? 'white' : 'transparent'};
							background-color: ${isActive ? colour : 'transparent'};
							display: flex;
							align-items: center;
							justify-content: center;
						`}
					>
						<svg
							viewBox="0 0 24 24"
							width="100%"
							height="100%"
							stroke="currentColor"
							strokeWidth="5"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="css-i6dzq1"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					</div>
				</>
			),
			color: isActive ? 'primary' : 'subdued',
			pinnable: false,
			extraAction: {
				iconType: 'popout', // EUI icon on the right
				onClick: (e) => {
					e.stopPropagation();
					onTickerClick();
				},
				'aria-label': 'More info',
				alwaysShow: false,
				className: 'hover-only-icon',
			},
		}),
	);

	useEffect(() => {
		if (isLargeScreen) {
			setNavIsOpen(false);
		}
	}, [isLargeScreen, setNavIsOpen]);

	return (
		<>
			<EuiCollapsibleNav
				isOpen={navIsOpen}
				isDocked={navIsDocked}
				size={300}
				button={
					!isPoppedOut ? (
						<EuiHeaderSectionItemButton
							aria-label="Toggle main navigation"
							onClick={() => setNavIsOpen((isOpen) => !isOpen)}
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
				onClose={() => setNavIsOpen(false)}
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
								<BetaBadge size={'medium'} />
							</h1>
						</EuiTitle>
					)}

					<EuiCollapsibleNavGroup title="Presets">
						<EuiPinnableListGroup
							onPinClick={() => {}}
							listItems={presetItems}
							maxWidth="none"
							color="subdued"
							gutterSize="none"
							size="s"
						/>
					</EuiCollapsibleNavGroup>
					<EuiCollapsibleNavGroup title={'Suppliers'}>
						<EuiPinnableListGroup
							onPinClick={() => {}}
							listItems={supplierItems}
							maxWidth="none"
							color="subdued"
							gutterSize="none"
							size="s"
						/>
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

				<div style={{ padding: '10px 5px' }}>
					<EuiSwitch
						label="Auto-update"
						checked={state.autoUpdate}
						onChange={toggleAutoUpdate}
					/>
				</div>
				<div>
					<EuiCallOut
						title="Please use with caution"
						iconType="info"
						color="primary"
					>
						This product is in early testing, actively being developed, and may
						change. <br />
						<FeedbackContent />
					</EuiCallOut>
				</div>
			</EuiCollapsibleNav>
		</>
	);
};
