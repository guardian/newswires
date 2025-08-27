import type { EuiSelectableOption } from '@elastic/eui';
import {
	EuiBadge,
	EuiBeacon,
	EuiButtonEmpty,
	EuiButtonIcon,
	EuiContextMenuPanel,
	EuiPopover,
	EuiSelectable,
	useGeneratedHtmlId,
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
import type { Preset } from './presets.ts';
import { presetFilterOptions, presetLabel } from './presets.ts';
import type { Query } from './sharedTypes.ts';
import { Tooltip } from './Tooltip.tsx';

type SearchTermBadgeLabel =
	| 'Search term'
	| 'Time range'
	| 'Preset'
	| 'Supplier'
	| 'Category'
	| '(NOT) Category'
	| 'Has data formatting';

const SummaryBadge = ({
	label,
	value,
	valueLabel,
	filterOptions = [],
}: {
	label: SearchTermBadgeLabel;
	value?: string;
	valueLabel?: string;
	filterOptions?: Preset[];
}) => {
	const [options, setOptions] = useState<EuiSelectableOption[]>(
		filterOptions.map((option: Preset) => {
			return {
				key: option.id,
				label: option.name,
				checked: option.id === value ? 'on' : undefined,
			} as EuiSelectableOption;
		}),
	);

	const [isPopoverOpen, setPopover] = useState(false);
	const contextMenuPopoverId = useGeneratedHtmlId({
		prefix: 'badgeContextMenuPopover',
	});

	const handleBadgeClick = () => {
		setPopover(!isPopoverOpen);
	};

	const closePopover = () => {
		setPopover(false);
	};

	const { config, handleEnterQuery, toggleSupplier } = useSearch();

	const handleRemoveBadge = (label: SearchTermBadgeLabel, value: string) => {
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
			case 'Has data formatting':
				handleEnterQuery({
					...config.query,
					hasDataFormatting: undefined,
				});
				break;
		}
	};

	if (!value) return null;

	const valueLabelToDisplay = valueLabel ?? value;

	const badge = (
		<EuiBadge
			key={value}
			title={`Filtered by ${label}: ${value}`}
			iconType="cross"
			iconSide="right"
			iconOnClickAriaLabel={`Remove ${label} filter from results`}
			iconOnClick={() => {
				handleRemoveBadge(label, value);
			}}
			onClick={() => handleBadgeClick()}
			onClickAriaLabel={'Open filter options'}
		>
			<strong>{label}</strong>
			{valueLabelToDisplay !== '' ? `: ${valueLabelToDisplay}` : ''}
		</EuiBadge>
	);

	if (filterOptions.length === 0) {
		return badge;
	}

	const handleChange = (updatedOptions: EuiSelectableOption[]) => {
		setOptions(updatedOptions);

		const selectedOption: EuiSelectableOption | undefined = updatedOptions.find(
			(option) => option.checked === 'on',
		);

		handleEnterQuery({
			...config.query,
			preset: selectedOption?.key,
		});
	};

	return (
		<EuiPopover
			id={contextMenuPopoverId}
			button={badge}
			isOpen={isPopoverOpen}
			closePopover={closePopover}
			panelPaddingSize="none"
			anchorPosition="downLeft"
		>
			<EuiContextMenuPanel
				css={css`
					padding: 4px;
				`}
			>
				<EuiSelectable
					singleSelection={true}
					aria-label="Find a data view"
					searchable
					searchProps={{
						compressed: true,
						placeholder: `Search ${label} options`,
						autoFocus: true,
					}}
					options={options}
					onChange={handleChange}
				>
					{(list, search) => (
						<>
							{search}
							{list}
						</>
					)}
				</EuiSelectable>
			</EuiContextMenuPanel>
		</EuiPopover>
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
	const displayExcludedCategoryCodes =
		categoryCodeExcl && categoryCodeExcl.length > 0;
	const displaySuppliers = (suppliers ?? []).length > 0;

	const displayFilters: boolean =
		!!q || !!preset || displayCategoryCodes || displaySuppliers;

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
					label="Time range"
					value={deriveDateMathRangeLabel(dateRange.start, dateRange.end)}
				/>
			)}
			{q && <SummaryBadge label="Search term" value={q} />}
			{preset && (
				<SummaryBadge
					label="Preset"
					value={preset}
					valueLabel={presetLabel(preset)}
					filterOptions={presetFilterOptions(preset)}
				/>
			)}
			{displaySuppliers &&
				suppliers!.map((supplier) => (
					<SummaryBadge key={supplier} label="Supplier" value={supplier} />
				))}
			{displayCategoryCodes &&
				categoryCode!.map((code) => (
					<SummaryBadge key={code} label="Category" value={code} />
				))}
			{displayExcludedCategoryCodes &&
				categoryCodeExcl.map((code) => (
					<SummaryBadge key={code} label="(NOT) Category" value={code} />
				))}
			{hasDataFormatting !== undefined && (
				<SummaryBadge
					label="Has data formatting"
					value={hasDataFormatting ? 'true' : 'false'}
				/>
			)}
		</>
	);
};

export const SearchSummary = () => {
	const {
		state: { queryData, status, lastUpdate },
		config,
		openTicker,
		setSideNavIsOpen,
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
