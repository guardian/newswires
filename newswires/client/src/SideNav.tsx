import {
	EuiBadge,
	EuiBadgeGroup,
	EuiCollapsibleNav,
	EuiCollapsibleNavGroup,
	EuiFlexGroup,
	EuiFlexItem,
	EuiHeaderSectionItemButton,
	EuiIcon,
	EuiListGroup,
	EuiListGroupItem,
	EuiText,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemo, useState } from 'react';
import { AFPBrand, APBrand, reutersBrand } from './sharedStyles';
import type { Query } from './sharedTypes';
import { useSearch } from './useSearch';

/**
 * The way this has developed, there are a bunch of optional fields that are only used for one or another application.
 * @todo refactor so that either there's something suitably generic or more likely we don't need this abstraction at all.
 */
interface MenuItem {
	label: string;
	query: Query;
	onClick?: () => void;
	resultsCount?: number;
	isActive?: boolean;
	colour?: string;
}

function decideLabelForQueryBadge(query: Query): string {
	const { supplier, q, subject } = query;
	const supplierLabel = supplier?.join(', ') ?? '';
	const qLabel = q.length > 0 ? `"${q}"` : '';
	const subjectLabel = subject?.join(', ') ?? '';
	const labels = [supplierLabel, qLabel, subjectLabel];
	return labels.filter((label) => label.length > 0).join(' ');
}

export const SideNav = () => {
	const [navIsOpen, setNavIsOpen] = useState<boolean>(false);

	const { state, config, handleEnterQuery } = useSearch();

	const suppliers = config.query.supplier?.map((s) => s.toLowerCase()) ?? [];

	const searchHistory = state.successfulQueryHistory;

	const searchHistoryItems: MenuItem[] = useMemo(
		() =>
			searchHistory.slice(1).map(({ query, resultsCount }) => ({
				label: decideLabelForQueryBadge(query),
				query,
				resultsCount,
			})),
		[searchHistory],
	);

	const agencies: MenuItem[] = [
		{
			label: 'All',
			query: { q: '' },
			isActive: suppliers.length === 0,
			onClick: () => handleEnterQuery({ ...config.query, supplier: [] }),
		},
		{
			label: 'Reuters',
			query: {
				q: '',
				supplier: ['Reuters'],
			},
			colour: reutersBrand,
			isActive: suppliers.includes('reuters'),
			onClick: () =>
				handleEnterQuery({
					...config.query,
					supplier: [...(config.query.supplier ?? []), 'reuters'],
				}),
		},
		{
			label: 'AP',
			query: { q: '', supplier: ['AP'] },
			colour: APBrand,
			isActive: suppliers.includes('ap'),
			onClick: () =>
				handleEnterQuery({
					...config.query,
					supplier: [...(config.query.supplier ?? []), 'ap'],
				}),
		},
		{
			label: 'AFP',
			query: { q: '', supplier: ['AFP'] },
			colour: AFPBrand,
			isActive: suppliers.includes('afp'),
			onClick: () =>
				handleEnterQuery({
					...config.query,
					supplier: [...(config.query.supplier ?? []), 'afp'],
				}),
		},
	];

	return (
		<>
			<EuiCollapsibleNav
				isOpen={navIsOpen}
				isDocked={true}
				size={240}
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
				<div>
					<SearchGroupAsLinks title="Agencies" items={agencies} />
					<SingleSearchAsListOfBadges
						title="Search filters"
						query={config.query}
					/>
					<SearchGroupAsBadges
						title="Search history"
						items={searchHistoryItems}
						isEmptyMessage="No search history available yet"
					/>
				</div>
			</EuiCollapsibleNav>
		</>
	);
};

/**
 * todo: refactor this -- we only use this once at the moment, so it's not worth the abstraction
 */
const SearchGroupAsLinks = ({
	title,
	items,
	isEmptyMessage,
}: {
	title: string;
	items: MenuItem[];
	isEmptyMessage?: string;
}) => {
	const { handleEnterQuery, config } = useSearch();
	const isEmpty = items.length === 0;

	return (
		<EuiCollapsibleNavGroup title={title}>
			{isEmpty ? (
				<EuiListGroupItem label={isEmptyMessage} /> // todo: this shouldn't be a listgroupItem anymore
			) : (
				<EuiListGroup
					maxWidth="none"
					color="subdued"
					gutterSize="none"
					size="s"
				>
					{items.map(({ label, query, colour, isActive, onClick }) => {
						return (
							<EuiListGroupItem
								key={label}
								label={label}
								onClick={onClick}
								icon={
									<div
										css={css`
											width: 0.5rem;
											height: 1.5rem;
											background-color: ${isActive
												? (colour ?? 'black')
												: 'transparent'};
										`}
									/>
								}
								aria-current={isActive ? 'page' : undefined}
							/>
						);
					})}
				</EuiListGroup>
			)}
		</EuiCollapsibleNavGroup>
	);
};

const SearchGroupAsBadges = ({
	title,
	items,
	isEmptyMessage,
}: {
	title: string;
	items: MenuItem[];
	isEmptyMessage?: string;
}) => {
	const { handleEnterQuery } = useSearch();
	const isEmpty = items.length === 0;

	return (
		<EuiCollapsibleNavGroup title={title}>
			{isEmpty ? (
				<EuiListGroupItem label={isEmptyMessage} /> // todo: this shouldn't be a listgroupItem anymore
			) : (
				<EuiBadgeGroup color="subdued" gutterSize="s">
					{items.map(({ label, query, resultsCount }) => {
						return (
							<EuiBadge
								key={label}
								color="secondary"
								onClick={() => {
									handleEnterQuery(query);
								}}
								onClickAriaLabel="Remove query filter"
							>
								{label} <EuiBadge color="hollow">{resultsCount}</EuiBadge>
							</EuiBadge>
						);
					})}
				</EuiBadgeGroup>
			)}
		</EuiCollapsibleNavGroup>
	);
};

const SingleSearchAsListOfBadges = ({
	title,
	query,
}: {
	title: string;
	query: Query;
}) => {
	return (
		<EuiCollapsibleNavGroup title={title}>
			<SearchQueryBadges query={query} />
		</EuiCollapsibleNavGroup>
	);
};

const SearchQueryBadges = ({ query }: { query: Query }) => {
	const { handleEnterQuery } = useSearch();
	const { supplier, q, subject } = query;

	if (
		q.length === 0 &&
		(!supplier || supplier.length === 0) &&
		(!subject || subject.length === 0)
	) {
		return <EuiListGroupItem label={'No filters applied'} />; // todo: this shouldn't be a listgroupItem anymore
	}

	return (
		<EuiFlexGroup wrap responsive={false} gutterSize="s">
			{q.length > 0 && (
				<EuiFlexItem grow={false}>
					<EuiBadge
						color="secondary"
						iconType="cross"
						iconSide="right"
						iconOnClick={() => {
							handleEnterQuery({ ...query, q: '' });
						}}
						iconOnClickAriaLabel="Remove text query filter"
					>
						{`"${q}"`}
					</EuiBadge>
				</EuiFlexItem>
			)}
			{supplier?.map((s) => (
				<EuiFlexItem grow={false} key={s}>
					<EuiBadge
						color="primary"
						iconType="cross"
						iconSide="right"
						iconOnClick={() => {
							handleEnterQuery({
								...query,
								supplier: supplier.filter((sup) => sup !== s),
							});
						}}
						iconOnClickAriaLabel={`Remove ${s} filter`}
					>
						{s}
					</EuiBadge>
				</EuiFlexItem>
			))}
			{subject?.map((s) => (
				<EuiFlexItem grow={false} key={s}>
					<EuiBadge
						color="accent"
						iconType="cross"
						iconSide="right"
						iconOnClick={() => {
							handleEnterQuery({
								...query,
								subject: subject.filter((sub) => sub !== s),
							});
						}}
						iconOnClickAriaLabel={`Remove ${s} filter`}
					>
						{s}
					</EuiBadge>
				</EuiFlexItem>
			))}
		</EuiFlexGroup>
	);
};
