import {
	EuiBadge,
	EuiBeacon,
	EuiButtonIcon,
	useIsWithinBreakpoints,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import {
	deriveDateMathRangeLabel,
	isDefaultDateRange,
	isRestricted,
} from './dateHelpers.ts';
import { isOpenAsTicker, openTicker } from './openTicker.ts';
import { Tooltip } from './Tooltip.tsx';

const presetLabel = (preset: string) => {
	switch (preset) {
		case 'all-presets':
			return 'All';
		case 'all-world':
			return 'World';
		case 'all-uk':
			return 'UK';
		case 'all-business':
			return 'Business';
		default:
			return preset;
	}
};

type SearchTermBadgeLabel =
	| 'Search term'
	| 'Time range'
	| 'Preset'
	| 'Supplier'
	| 'Category'
	| '(NOT) Category';

const Summary = ({
	searchSummaryLabel,
}: {
	searchSummaryLabel: string | boolean;
}) => {
	const { config, handleEnterQuery, toggleSupplier } = useSearch();
	const {
		q,
		preset,
		supplier: suppliers,
		dateRange,
		categoryCode,
		categoryCodeExcl,
	} = config.query;

	const displayCategoryCodes = (categoryCode ?? []).length > 0;
	const displayExcludedCategoryCodes =
		categoryCodeExcl && categoryCodeExcl.length > 0;
	const displaySuppliers = (suppliers ?? []).length > 0;

	const displayFilters: boolean =
		!!q || !!preset || displayCategoryCodes || displaySuppliers;

	const handleBadgeClick = (label: SearchTermBadgeLabel, value: string) => {
		const categoryCodes = config.query.categoryCode ?? [];
		const categoryCodesExcl = config.query.categoryCodeExcl ?? [];

		switch (label) {
			case 'Search term':
				handleEnterQuery({
					...config.query,
					q: '',
				});
				break;
			case 'Time range':
				handleEnterQuery({
					...config.query,
					dateRange: undefined,
				});
				break;
			case 'Supplier':
				toggleSupplier(value);
				break;
			case 'Preset':
				handleEnterQuery({
					...config.query,
					preset: undefined,
				});
				break;
			case 'Category':
				handleEnterQuery({
					...config.query,
					categoryCode: categoryCodes.filter((s: string) => s !== value),
				});
				break;
			case '(NOT) Category':
				handleEnterQuery({
					...config.query,
					categoryCodeExcl: categoryCodesExcl.filter(
						(s: string) => s !== value,
					),
				});
				break;
		}
	};

	const renderBadge = (label: SearchTermBadgeLabel, value: string) =>
		value ? (
			<EuiBadge
				key={value}
				title={`Filtered by ${label}: ${value}`}
				iconType="cross"
				iconSide="right"
				iconOnClickAriaLabel={`Remove ${label} filter from results`}
				iconOnClick={() => {
					handleBadgeClick(label, value);
				}}
			>
				<strong>{label}</strong>
				{value !== '' ? `: ${value}` : ''}
			</EuiBadge>
		) : null;

	return (
		<>
			{searchSummaryLabel && (
				<h2>
					{searchSummaryLabel}
					{displayFilters && ' for: '}
				</h2>
			)}
			{!searchSummaryLabel && (
				<h2
					css={css`
						display: none;
					`}
					className="sr-only"
				>
					Search summary:
				</h2>
			)}
			{dateRange &&
				!isDefaultDateRange(dateRange) &&
				renderBadge(
					'Time range',
					deriveDateMathRangeLabel(dateRange.start, dateRange.end),
				)}
			{q && renderBadge('Search term', q)}
			{preset && renderBadge('Preset', presetLabel(preset))}
			{displaySuppliers &&
				suppliers!.map((supplier) => renderBadge('Supplier', supplier))}
			{displayCategoryCodes &&
				categoryCode!.map((code) => renderBadge('Category', code))}
			{displayExcludedCategoryCodes &&
				categoryCodeExcl.map((code) => renderBadge('(NOT) Category', code))}
		</>
	);
};

export const SearchSummary = () => {
	const isPoppedOut = isOpenAsTicker();

	const {
		state: { queryData, status, lastUpdate },
		config,
	} = useSearch();
	const [searchSummary, setSearchSummary] = useState('No results found');

	const isSmallScreen = useIsWithinBreakpoints(['xs', 's', 'm']);

	useEffect(() => {
		if (!isPoppedOut) {
			return;
		}

		const { preset, supplier } = config.query;

		const displayPreset = !!preset;
		const displaySuppliers = !!supplier && supplier.length > 0;

		if (displayPreset || displaySuppliers) {
			const titlePrefix = supplier!.length == 1 ? `${supplier![0]} ` : '';
			const titlePostfix =
				supplier!.length > 1 ? ` ${supplier!.join(', ')}` : '';

			document.title = `${titlePrefix}${preset ? `${presetLabel(preset).toUpperCase()}` : ''}${titlePostfix}`;
		} else {
			document.title = 'Newswires';
		}
	}, [isPoppedOut, config.query]);

	useEffect(() => {
		if (queryData && queryData.totalCount > 0) {
			setSearchSummary(
				`Showing ${Intl.NumberFormat('en-GB').format(queryData.totalCount)} result${queryData.totalCount > 1 ? 's' : ''}`,
			);
		} else {
			setSearchSummary('No results found');
		}
	}, [queryData]);

	return (
		<div
			css={css`
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				font-size: 18px;
				font-weight: 500;
				gap: 4px;
				line-height: 1.5;
				padding: 0 8px;
			`}
		>
			{!isPoppedOut && (
				<Tooltip
					tooltipContent="Open new ticker"
					position={isSmallScreen ? 'right' : 'top'}
				>
					<EuiButtonIcon
						css={css`
							margin-right: 4px;
						`}
						aria-label="Open new ticker in popout"
						iconType={'popout'}
						color={'primary'}
						onClick={() => openTicker(config.query)}
					/>
				</Tooltip>
			)}

			{isPoppedOut &&
				(isRestricted(config.query.dateRange?.end) ||
					status === 'offline' ||
					!lastUpdate) && (
					<div
						style={{
							width: '10px',
							height: '10px',
							backgroundColor: 'red',
							borderRadius: '50%',
							display: 'inline-block',
							boxShadow: '0 0 4px red',
						}}
						title="Offline"
					/>
				)}

			{isPoppedOut &&
				!isRestricted(config.query.dateRange?.end) &&
				status !== 'offline' &&
				lastUpdate && (
					<Tooltip
						tooltipContent={`Last update: ${lastUpdate}`}
						position={'right'}
					>
						<EuiBeacon
							css={css`
								margin-right: 4px;
							`}
						/>
					</Tooltip>
				)}
			<Summary searchSummaryLabel={!isPoppedOut && searchSummary} />
		</div>
	);
};
