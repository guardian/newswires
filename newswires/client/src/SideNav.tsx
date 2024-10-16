import {
	EuiCollapsibleNav,
	EuiCollapsibleNavGroup,
	EuiHeaderSectionItemButton,
	EuiIcon,
	EuiListGroup,
} from '@elastic/eui';
import { useMemo, useState } from 'react';
import type { Query } from './sharedTypes';
import { useSearch } from './useSearch';

interface MenuItem {
	label: string;
	query: Query;
}

export const SideNav = () => {
	const [navIsOpen, setNavIsOpen] = useState<boolean>(false);

	const { state } = useSearch();

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
		{ label: 'All', query: { q: '' } },
		{ label: 'Reuters', query: { q: '', supplier: ['REUTERS'] } },
		{ label: 'AP', query: { q: '', supplier: ['AP'] } },
		{ label: 'PA', query: { q: '', supplier: ['PA'] } },
		{ label: 'AAP', query: { q: '', supplier: ['AAP'] } },
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

	const listItems =
		items.length > 0
			? items.map(({ label, query }) => ({
					label: label,
					onClick: () => handleEnterQuery(query),
				}))
			: [{ label: isEmptyMessage ?? 'No items available' }];

	return (
		<EuiCollapsibleNavGroup title={title}>
			<EuiListGroup
				listItems={listItems}
				maxWidth="none"
				color="subdued"
				gutterSize="none"
				size="s"
			/>
		</EuiCollapsibleNavGroup>
	);
};
