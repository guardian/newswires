import {
	EuiBadge,
	EuiBeacon,
	EuiButtonEmpty,
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
import { presetLabel, sportPresets } from './presets.ts';
import type { Query } from './sharedTypes.ts';
import { Tooltip } from './Tooltip.tsx';

const SearchTermBadgeLabelLookup: Record<keyof Query, string> = {
	q: 'Search term',
	dateRange: 'Time range',
	preset: 'Preset',
	supplier: 'Supplier',
	supplierExcl: '(NOT) Supplier',
	categoryCode: 'Category',
	categoryCodeExcl: '(NOT) Category',
	hasDataFormatting: 'Has data formatting',
	keyword: 'Keyword',
	keywordExcl: '(NOT) Keyword',
} as const;

export const updateQuery = (
	key: keyof Query,
	value: string,
	query: Query,
): Partial<Query> => {
	if (key === 'q') {
		return { q: '' };
	}
	if (key === 'preset') {
		if (
			// TODO -> make this more generic and assoicate the sportsPreset to all-sport in the
			// presets defintion?
			sportPresets.map((p) => p.id).includes(value) &&
			value !== 'all-sport'
		) {
			return { [key]: 'all-sport' };
		} else {
			return { [key]: undefined };
		}
	}
	if (['dateRange', 'hasDataFormatting'].includes(key)) {
		return { [key]: undefined };
	}
	if (
		['categoryCode', 'categoryCodeExcl', 'keyword', 'keywordExcl'].includes(key)
	) {
		const current = query[key] as string[] | undefined;
		return { [key]: (current ?? []).filter((s) => s !== value) };
	}
	return {};
};
const SummaryBadge = ({
	queryParamKey,
	value,
	valueLabel,
}: {
	queryParamKey: keyof Query;
	value?: string;
	valueLabel?: string;
}) => {
	const label = SearchTermBadgeLabelLookup[queryParamKey];

	const { config, handleEnterQuery, toggleSupplier } = useSearch();

	const handleRemoveBadge = (key: keyof Query, value: string) => {
		if (['supplier', 'supplierExcl'].includes(key)) {
			toggleSupplier(value);
		} else {
			handleEnterQuery({
				...config.query,
				...updateQuery(key, value, config.query),
			});
		}
	};

	if (!value) return null;

	const valueLabelToDisplay = valueLabel ?? value;

	return (
		<EuiBadge
			key={value}
			title={`Filtered by ${label}: ${value}`}
			iconType="cross"
			iconSide="right"
			iconOnClickAriaLabel={`Remove ${label} filter from results`}
			iconOnClick={() => {
				handleRemoveBadge(queryParamKey, value);
			}}
		>
			<strong>{label}</strong>
			{valueLabelToDisplay !== '' ? `: ${valueLabelToDisplay}` : ''}
		</EuiBadge>
	);
};

const Summary = ({
	query,
	searchSummaryLabel,
}: {
	query: Query;
	searchSummaryLabel: string | boolean;
}) => {
	const {
		q,
		preset,
		supplier: suppliers,
		dateRange,
		categoryCode,
		categoryCodeExcl,
		hasDataFormatting,
	} = query;

	const displayCategoryCodes = (categoryCode ?? []).length > 0;
	const displayExcludedCategoryCodes = (categoryCodeExcl ?? []).length > 0;
	const displaySuppliers = (suppliers ?? []).length > 0;
	const displayKeywords = (query.keyword ?? []).length > 0;
	const displayExcludedKeywords = (query.keywordExcl ?? []).length > 0;

	const displayFilters: boolean =
		!!q ||
		!!preset ||
		displayCategoryCodes ||
		displaySuppliers ||
		displayKeywords ||
		displayExcludedCategoryCodes ||
		displayExcludedKeywords ||
		hasDataFormatting !== undefined;

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
			{dateRange && !isDefaultDateRange(dateRange) && (
				<SummaryBadge
					queryParamKey="dateRange"
					value={deriveDateMathRangeLabel(dateRange.start, dateRange.end)}
				/>
			)}
			{q && <SummaryBadge queryParamKey="q" value={q} />}
			{preset && (
				<SummaryBadge
					queryParamKey="preset"
					value={preset}
					valueLabel={presetLabel(preset)}
				/>
			)}

			{suppliers?.map((supplier) => (
				<SummaryBadge
					key={supplier}
					queryParamKey="supplier"
					value={supplier}
				/>
			))}
			{displayCategoryCodes &&
				categoryCode?.map((code) => (
					<SummaryBadge key={code} queryParamKey="categoryCode" value={code} />
				))}
			{displayExcludedCategoryCodes &&
				categoryCodeExcl?.map((code) => (
					<SummaryBadge
						key={code}
						queryParamKey="categoryCodeExcl"
						value={code}
					/>
				))}
			{displayKeywords &&
				query.keyword?.map((keyword) => (
					<SummaryBadge key={keyword} queryParamKey="keyword" value={keyword} />
				))}
			{displayExcludedKeywords &&
				query.keywordExcl?.map((keyword) => (
					<SummaryBadge
						key={keyword}
						queryParamKey="keywordExcl"
						value={keyword}
					/>
				))}
			{hasDataFormatting !== undefined && (
				<SummaryBadge
					queryParamKey="hasDataFormatting"
					value={hasDataFormatting ? 'true' : 'false'}
				/>
			)}
		</>
	);
};

export const SearchSummary = ({
	setSideNavIsOpen,
}: {
	setSideNavIsOpen: (isOpen: boolean) => void;
}) => {
	const {
		state: { queryData, status, lastUpdate },
		config,
		openTicker,
	} = useSearch();
	const isPoppedOut = config.ticker;

	const [searchSummary, setSearchSummary] = useState('No results found');

	const isSmallScreen = useIsWithinBreakpoints(['xs', 's', 'm']);

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
				font-size: 1.25rem;
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
			<Summary
				query={config.query}
				searchSummaryLabel={!isPoppedOut && searchSummary}
			/>

			{isPoppedOut && (
				<EuiButtonEmpty
					size="xs"
					iconType={'menu'}
					onClick={() => setSideNavIsOpen(true)}
					css={css`
						margin-left: 4px;
						color: #07101f;
						background-color: #e3e8f2;
					`}
				>
					Open filters
				</EuiButtonEmpty>
			)}
		</div>
	);
};
