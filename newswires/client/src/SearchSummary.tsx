import {
	EuiBadge,
	EuiBeacon,
	EuiButtonEmpty,
	EuiButtonIcon,
	useIsWithinBreakpoints,
	usePrettyDuration,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { DEFAULT_DATE_RANGE } from './dateConstants.ts';
import { isRestricted } from './dateHelpers.ts';
import { presetLabel } from './presets.ts';
import type {
	DeselectableQueryKey,
	DeselectableQueryKeyValue,
} from './queryHelpers.ts';
import { keyValueAfterDeselection } from './queryHelpers.ts';
import type { Query } from './sharedTypes.ts';
import { Tooltip } from './Tooltip.tsx';

const SearchTermBadgeLabelLookup: Record<DeselectableQueryKey, string> = {
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
	start: 'From',
	end: 'To',
} as const;

const SummaryBadge = ({
	keyValuePair,
	valueLabel,
}: {
	keyValuePair: DeselectableQueryKeyValue;
	valueLabel?: string;
}) => {
	const label = SearchTermBadgeLabelLookup[keyValuePair.key];

	const { config, handleEnterQuery, toggleSupplier } = useSearch();

	const handleRemoveBadge = (keyValuePair: DeselectableQueryKeyValue) => {
		if (
			keyValuePair.key === 'supplier' ||
			keyValuePair.key === 'supplierExcl'
		) {
			toggleSupplier(keyValuePair.value);
		} else {
			handleEnterQuery({
				...config.query,
				...keyValueAfterDeselection(keyValuePair, config.query),
			});
		}
	};

	const valueLabelToDisplay = valueLabel ?? keyValuePair.value;

	return (
		<EuiBadge
			key={keyValuePair.value}
			title={`Filtered by ${label}: ${valueLabel ?? keyValuePair.value}`}
			iconType="cross"
			iconSide="right"
			iconOnClickAriaLabel={`Remove ${label} filter from results`}
			iconOnClick={() => {
				handleRemoveBadge(keyValuePair);
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
		start,
		end,
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

	const isDefaultDateRange =
		start === DEFAULT_DATE_RANGE.start &&
		(end === DEFAULT_DATE_RANGE.end || end === undefined);

	const durationLabel = usePrettyDuration({
		timeFrom: start as string,
		timeTo: (end ?? DEFAULT_DATE_RANGE.end) as string,
		dateFormat: 'MMM D • HH:mm',
	});

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
			{!isDefaultDateRange && (
				<SummaryBadge
					keyValuePair={{ key: 'dateRange', value: undefined }}
					valueLabel={durationLabel}
				/>
			)}
			{q && <SummaryBadge keyValuePair={{ key: 'q', value: q }} />}
			{preset && (
				<SummaryBadge
					keyValuePair={{ key: 'preset', value: preset }}
					valueLabel={presetLabel(preset)}
				/>
			)}

			{suppliers?.map((supplier) => (
				<SummaryBadge
					key={supplier}
					keyValuePair={{ key: 'supplier', value: supplier }}
					valueLabel={supplier}
				/>
			))}
			{displayCategoryCodes &&
				categoryCode?.map((code) => (
					<SummaryBadge
						key={code}
						keyValuePair={{ key: 'categoryCode', value: code }}
					/>
				))}
			{displayExcludedCategoryCodes &&
				categoryCodeExcl?.map((code) => (
					<SummaryBadge
						key={code}
						keyValuePair={{ key: 'categoryCodeExcl', value: code }}
					/>
				))}
			{displayKeywords &&
				query.keyword?.map((keyword) => (
					<SummaryBadge
						key={keyword}
						keyValuePair={{ key: 'keyword', value: keyword }}
					/>
				))}
			{displayExcludedKeywords &&
				query.keywordExcl?.map((keyword) => (
					<SummaryBadge
						key={keyword}
						keyValuePair={{ key: 'keywordExcl', value: keyword }}
					/>
				))}
			{hasDataFormatting !== undefined && (
				<SummaryBadge
					keyValuePair={{
						key: 'hasDataFormatting',
						value: hasDataFormatting ? 'true' : 'false',
					}}
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
				(isRestricted(config.query.end) ||
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
				!isRestricted(config.query.end) &&
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
