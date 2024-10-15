import {
	EuiCollapsibleNav,
	EuiCollapsibleNavGroup,
	EuiHeaderSectionItemButton,
	EuiIcon,
	EuiListGroup,
	EuiListGroupItem,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useMemo, useState } from 'react';
import { AFPBrand, APBrand, reutersBrand } from './sharedStyles';
import type { Query } from './sharedTypes';
import { useSearch } from './useSearch';

interface MenuItem {
	label: string;
	query: Query;
	isActive?: boolean;
	colour?: string;
}

export const SideNav = () => {
	const [navIsOpen, setNavIsOpen] = useState<boolean>(false);

	const { state, config } = useSearch();

	const suppliers = config.query.supplier ?? [];

	const searchHistory = state.successfulQueryHistory;

	const searchHistoryItems: MenuItem[] = useMemo(
		() =>
			searchHistory.map(({ query, resultsCount }) => ({
				label: `${query.q} (${resultsCount})`,
				query,
			})),
		[searchHistory],
	);

	const agencies: MenuItem[] = [
		{ label: 'All', query: { q: '' }, isActive: suppliers.length === 0 },
		{
			label: 'Reuters',
			query: {
				q: '',
				supplier: ['Reuters'],
			},
			colour: reutersBrand,
			isActive: suppliers.includes('Reuters'),
		},
		{
			label: 'AP',
			query: { q: '', supplier: ['AP'] },
			colour: APBrand,
			isActive: suppliers.includes('AP'),
		},
		{
			label: 'AFP',
			query: { q: '', supplier: ['AFP'] },
			colour: AFPBrand,
			isActive: suppliers.includes('AFP'),
		},
	];

	const savedSearches: MenuItem[] = [
		{ label: 'My saved search', query: { q: 'sourceFeed:Reuters' } },
		{ label: 'Another saved search', query: { q: 'sourceFeed:AP' } },
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
					<SearchGroup title="Agencies" items={agencies} />
					<SearchGroup title="Saved searches" items={savedSearches} />
					<SearchGroup
						title="Search history"
						items={searchHistoryItems}
						isEmptyMessage="No search history available yet"
					/>
				</div>
			</EuiCollapsibleNav>
		</>
	);
};

const SearchGroup = ({
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
				<EuiListGroupItem label={isEmptyMessage} />
			) : (
				<EuiListGroup
					maxWidth="none"
					color="subdued"
					gutterSize="none"
					size="s"
				>
					{items.map(({ label, query, colour, isActive }) => {
						return (
							<EuiListGroupItem
								key={label}
								label={label}
								onClick={() => handleEnterQuery(query)}
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
