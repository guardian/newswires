import { EuiBadge, EuiText } from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { deriveDateMathRangeLabel } from './dateHelpers.ts';

const Summary = ({ searchSummary }: { searchSummary: string }) => {
	const { config, handleEnterQuery } = useSearch();
	const {
		q,
		bucket,
		supplier: suppliers,
		dateRange,
		categoryCode,
	} = config.query;

	const displayCategoryCodes = (categoryCode ?? []).length > 0;
	const displaySuppliers = (suppliers ?? []).length > 0;

	const displayFilters: boolean =
		!!q || !!bucket || displayCategoryCodes || displaySuppliers;

	const handleBadgeClick = (label: string, value?: string) => {
		const supplier = config.query.supplier ?? [];
		const categoryCodes = config.query.categoryCode ?? [];

		handleEnterQuery({
			...config.query,
			q: label === 'Search term' ? '' : config.query.q,
			dateRange: label === 'Time range' ? undefined : config.query.dateRange,
			bucket: label === 'Bucket' ? undefined : config.query.bucket,
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
				onClickAriaLabel={`Remove ${label} filter from results`}
				onClick={() => {
					handleBadgeClick(label, value);
				}}
			>
				<strong>{label}</strong>
				{value !== '' ? `: ${value}` : ''}
			</EuiBadge>
		) : null;

	return (
		<>
			<span>
				{searchSummary}
				{displayFilters && ' for: '}
			</span>
			{dateRange &&
				renderBadge(
					'Time range',
					deriveDateMathRangeLabel(dateRange.start, dateRange.end),
				)}
			{q && renderBadge('Search term', q)}
			{bucket && renderBadge('Bucket', bucket)}
			{displaySuppliers &&
				suppliers!.map((supplier) => renderBadge('Supplier', supplier))}
			{displayCategoryCodes &&
				categoryCode!.map((code) => renderBadge('Category code', code))}
		</>
	);
};

export const SearchSummary = () => {
	const {
		state: { queryData },
	} = useSearch();
	const [searchSummary, setSearchSummary] = useState('No results found');

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
				margin-bottom: 18px;
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
				<Summary searchSummary={searchSummary} />
			</p>
		</EuiText>
	);
};
