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
	useIsWithinMinBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useCallback, useMemo, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { deriveDateMathRangeLabel } from './dateHelpers.ts';
import { FeedbackContent } from './FeedbackContent.tsx';
import { SearchBox } from './SearchBox';
import type { Config, Query } from './sharedTypes';
import { recognisedSuppliers, supplierData } from './suppliers.ts';
import { configToUrl } from './urlState.ts';

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

const presets = [
	{ id: 'all-presets', name: 'All' },
	{ id: 'all-world', name: 'World' },
	{ id: 'all-uk', name: 'UK' },
];

function presetName(presetId: string): string | undefined {
	return presets.find((preset) => preset.id === presetId)?.name;
}

const openTicker = (queryType: string, config: Config, value?: string) => {
	const query =
		queryType === 'preset'
			? {
					...config.query,
					preset: value ? value : undefined,
				}
			: {
					...config.query,
					supplier: value ? [value] : [],
				};

	window.open(
		configToUrl({
			...config,
			query,
			view: 'feed',
			itemId: undefined,
		}),
		'_blank',
		'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no',
	);
};

export const SideNav = () => {
	const [navIsOpen, setNavIsOpen] = useState<boolean>(false);
	const isOnLargerScreen = useIsWithinMinBreakpoint('m');

	const { state, config, handleEnterQuery, toggleAutoUpdate } = useSearch();

	const searchHistory = state.successfulQueryHistory;
	const activeSuppliers = useMemo(
		() => config.query.supplier ?? [],
		[config.query.supplier],
	);

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

	const toggleSupplier = useCallback(
		(supplier: string) => {
			// If 'activeSuppliers' is empty, that means that *all* suppliers are active.
			if (activeSuppliers.length === 0) {
				handleEnterQuery({
					...config.query,
					supplier: [supplier],
				});
				return;
			}
			const newSuppliers = activeSuppliers.includes(supplier)
				? activeSuppliers.filter((s) => s !== supplier)
				: [...activeSuppliers, supplier];
			handleEnterQuery({
				...config.query,
				// if all the suppliers are active, we don't need to specify them in the query
				supplier: recognisedSuppliers.every((s) => newSuppliers.includes(s))
					? []
					: newSuppliers,
			});
		},
		[config.query, handleEnterQuery, activeSuppliers],
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
					openTicker('supplier', config);
				},
				colour: 'black',
			},
			...Object.entries(supplierData).map(([supplier, { label, colour }]) => ({
				label,
				isActive:
					activeSuppliers.includes(supplier) || activeSuppliers.length === 0,
				colour: colour,
				onClick: () => toggleSupplier(supplier),
				onTickerClick: () => {
					openTicker('supplier', config, supplier);
				},
			})),
		],
		[activeSuppliers, handleEnterQuery, toggleSupplier, config],
	);

	const presetItems = useMemo(() => {
		const togglePreset = (preset: string) =>
			activePreset === preset || preset === 'all-presets' ? undefined : preset;

		return presets.map(({ id: presetId, name }) => {
			const isActive =
				activePreset === presetId ||
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
							width: 0.5rem;
							height: 1.5rem;

							margin-right: 12px;
							background-color: ${isActive
								? 'rgb(0, 119, 204)'
								: 'transparent'};
						`}
					/>
				),
				color: isActive ? 'primary' : 'subdued',
				pinnable: false,
				extraAction: {
					iconType: 'popout', // EUI icon on the right
					onClick: () => {
						openTicker('preset', config, presetId);
					},
					'aria-label': 'More info',
					alwaysShow: false,
					className: 'hover-only-icon',
				},
			};
		}) as EuiPinnableListGroupItemProps[];
	}, [activePreset, config, handleEnterQuery]);

	const supplierItems: EuiPinnableListGroupItemProps[] = suppliers.map(
		({ label, colour, isActive, onClick, onTickerClick }) => ({
			id: label,
			label,
			onClick,
			isActive,
			iconType: () => (
				<div
					css={css`
						width: 0.5rem;
						height: 1.5rem;

						margin-right: 12px;
						background-color: ${isActive ? colour : 'transparent'};
					`}
				/>
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

	return (
		<>
			<EuiCollapsibleNav
				isOpen={navIsOpen}
				isDocked={isOnLargerScreen}
				size={300}
				button={
					<EuiHeaderSectionItemButton
						aria-label="Toggle main navigation"
						onClick={() => setNavIsOpen((isOpen) => !isOpen)}
					>
						<EuiIcon type={'menu'} size="m" aria-hidden="true" />
					</EuiHeaderSectionItemButton>
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
					.euiListGroupItem:hover:focus-within .hover-only-icon {
						opacity: 1;
						pointer-events: auto;
					}

					.euiListGroupItem:focus-within .hover-only-icon {
						opacity: 0;
						pointer-events: none;
					}
				`}
			>
				<div style={{ height: '90%', overflowY: 'auto' }}>
					<SearchBox />
					<EuiCollapsibleNavGroup title="Presets">
						<EuiPinnableListGroup
							onPinClick={() => {}}
							listItems={presetItems}
							maxWidth="none"
							color="subdued"
							gutterSize="s"
							size="s"
						/>
					</EuiCollapsibleNavGroup>
					<EuiCollapsibleNavGroup title={'Suppliers'}>
						<EuiPinnableListGroup
							onPinClick={() => {}}
							listItems={supplierItems}
							maxWidth="none"
							color="subdued"
							gutterSize="s"
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

				<div style={{ padding: '20px 10px' }}>
					<EuiSwitch
						label="Auto-update"
						checked={state.autoUpdate}
						onChange={toggleAutoUpdate}
					/>
				</div>
				<div>
					<EuiCallOut
						title="Please use with caution"
						iconType="iInCircle"
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
