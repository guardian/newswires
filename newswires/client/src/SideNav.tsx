import {
	EuiBadge,
	EuiBadgeGroup,
	EuiCallOut,
	EuiCollapsibleNav,
	EuiCollapsibleNavGroup,
	EuiHeaderSectionItemButton,
	EuiIcon,
	EuiListGroup,
	EuiListGroupItem,
	EuiSwitch,
	EuiText,
	useEuiTheme,
	useIsWithinMinBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useCallback, useMemo, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { deriveDateMathRangeLabel } from './dateHelpers.ts';
import { FeedbackContent } from './FeedbackContent.tsx';
import { SearchBox } from './SearchBox';
import type { Query } from './sharedTypes';
import { recognisedSuppliers, supplierData } from './suppliers.ts';

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

const presets = [{ id: 'all-world', name: 'World' }];

function presetName(presetId: string): string | undefined {
	return presets.find((preset) => preset.id === presetId)?.name;
}

export const SideNav = () => {
	const [navIsOpen, setNavIsOpen] = useState<boolean>(false);
	const theme = useEuiTheme();
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

	const supplierItems = useMemo(
		() => [
			{
				label: 'All',
				isActive:
					activeSuppliers.length === 0 ||
					activeSuppliers.length === recognisedSuppliers.length,
				onClick: () => handleEnterQuery({ ...config.query, supplier: [] }),
				colour: 'black',
			},
			...Object.entries(supplierData).map(([supplier, { label, colour }]) => ({
				label,
				isActive:
					activeSuppliers.includes(supplier) || activeSuppliers.length === 0,
				colour: colour,
				onClick: () => toggleSupplier(supplier),
			})),
		],
		[activeSuppliers, config.query, handleEnterQuery, toggleSupplier],
	);

	const presetItems = useMemo(() => {
		const togglePreset = (preset: string) =>
			activePreset === preset ? undefined : preset;

		return [
			...presets.map(({ id: presetId, name }) => ({
				presetId,
				label: name,
				isActive: activePreset === presetId,
				onClick: () =>
					handleEnterQuery({ ...config.query, preset: togglePreset(presetId) }),
			})),
		];
	}, [activePreset, config.query, handleEnterQuery]);

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
			>
				<div style={{ height: '90%', overflowY: 'auto' }}>
					<SearchBox />
					<EuiCollapsibleNavGroup title="Presets">
						<EuiListGroup
							maxWidth="none"
							color="subdued"
							gutterSize="none"
							size="s"
						>
							{presetItems.map(({ presetId, label, isActive, onClick }) => {
								return (
									<EuiListGroupItem
										color={isActive ? 'primary' : 'subdued'}
										label={label}
										key={presetId}
										aria-current={isActive}
										onClick={onClick}
										icon={
											<div
												css={css`
													width: 0.5rem;
													height: 1.5rem;
													background-color: ${isActive
														? theme.euiTheme.colors.primary
														: 'transparent'};
												`}
											/>
										}
									/>
								);
							})}
						</EuiListGroup>
					</EuiCollapsibleNavGroup>
					<EuiCollapsibleNavGroup title={'Suppliers'}>
						<EuiListGroup
							maxWidth="none"
							color="subdued"
							gutterSize="none"
							size="s"
						>
							{supplierItems.map(({ label, colour, isActive, onClick }) => {
								return (
									<EuiListGroupItem
										color={isActive ? 'primary' : 'subdued'}
										key={label}
										label={label}
										onClick={onClick}
										icon={
											<div
												css={css`
													width: 0.5rem;
													height: 1.5rem;
													background-color: ${isActive
														? colour
														: 'transparent'};
												`}
											/>
										}
										aria-current={isActive}
									/>
								);
							})}
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
