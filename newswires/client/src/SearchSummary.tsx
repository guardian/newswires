import { EuiBadge, EuiText } from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';

const Summary = ({ searchSummary }: { searchSummary: string }) => {
	const { config, handleEnterQuery } = useSearch();
	const { q, bucket, subjects, supplier: suppliers } = config.query;

	const displaySubjects = (subjects ?? []).length > 0;
	const displaySuppliers = (suppliers ?? []).length > 0;

	const displayFilters: boolean =
		!!q || !!bucket || displaySubjects || displaySuppliers;

	const handleBadgeClick = (label: string, value?: string) => {
		const supplier = config.query.supplier ?? [];
		const subjects = config.query.subjects ?? [];

		handleEnterQuery({
			...config.query,
			q: label === 'Search term' ? '' : config.query.q,
			bucket: label === 'Bucket' ? undefined : config.query.bucket,
			supplier:
				label === 'Supplier'
					? supplier.filter((s: string) => s !== value)
					: supplier,
			subjects:
				label === 'Subject'
					? subjects.filter((s: string) => s !== value)
					: subjects,
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
				<strong>{label}</strong>: {value}
			</EuiBadge>
		) : null;

	return (
		<>
			<span>
				{searchSummary}
				{displayFilters && ' for: '}
			</span>
			{q && renderBadge('Search term', q)}
			{bucket && renderBadge('Bucket', bucket)}
			{displaySuppliers &&
				suppliers!.map((supplier) => renderBadge('Supplier', supplier))}
			{displaySubjects &&
				subjects!.map((subject) => renderBadge('Subject', subject))}
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
