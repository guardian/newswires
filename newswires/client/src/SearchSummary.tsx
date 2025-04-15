import {
	EuiBadge,
	EuiBeacon,
	EuiButtonIcon,
	EuiText,
	useIsWithinBreakpoints,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { deriveDateMathRangeLabel, isRestricted } from './dateHelpers.ts';
import { Tooltip } from './Tooltip.tsx';
import { configToUrl } from './urlState.ts';

const presetLabel = (preset: string) => {
	switch (preset) {
		case 'all-world':
			return 'World';
		default:
			return '';
	}
};

const Summary = ({
	searchSummaryLabel,
}: {
	searchSummaryLabel: string | boolean;
}) => {
	const { config, handleEnterQuery } = useSearch();
	const {
		q,
		preset,
		supplier: suppliers,
		dateRange,
		categoryCode,
	} = config.query;

	const displayCategoryCodes = (categoryCode ?? []).length > 0;
	const displaySuppliers = (suppliers ?? []).length > 0;

	const displayFilters: boolean =
		!!q || !!preset || displayCategoryCodes || displaySuppliers;

	const handleBadgeClick = (label: string, value?: string) => {
		const supplier = config.query.supplier ?? [];
		const categoryCodes = config.query.categoryCode ?? [];

		handleEnterQuery({
			...config.query,
			q: label === 'Search term' ? '' : config.query.q,
			dateRange: label === 'Time range' ? undefined : config.query.dateRange,
			preset: label === 'Preset' ? undefined : config.query.preset,
			supplier:
				label === 'Supplier'
					? supplier.filter((s: string) => s !== value)
					: supplier,
			categoryCode:
				label === 'Category code'
					? categoryCodes.filter((s: string) => s !== value)
					: categoryCodes,
		});
	};

	const renderBadge = (label: string, value?: string) =>
		value ? (
			<EuiBadge
				key={value}
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
				<span>
					{searchSummaryLabel}
					{displayFilters && ' for: '}
				</span>
			)}
			{dateRange &&
				renderBadge(
					'Time range',
					deriveDateMathRangeLabel(dateRange.start, dateRange.end),
				)}
			{q && renderBadge('Search term', q)}
			{preset && renderBadge('Preset', presetLabel(preset))}
			{displaySuppliers &&
				suppliers!.map((supplier) => renderBadge('Supplier', supplier))}
			{displayCategoryCodes &&
				categoryCode!.map((code) => renderBadge('Category code', code))}
		</>
	);
};

export const SearchSummary = () => {
	const isPoppedOut = !!window.opener;

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
		<EuiText
			css={css`
				margin-top: 6px;
			`}
		>
			<p
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
			</p>
		</EuiText>
	);
};
