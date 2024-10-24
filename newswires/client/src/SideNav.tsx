import {
	EuiBadge,
	EuiBadgeGroup,
	EuiButtonIcon,
	EuiCollapsibleNav,
	EuiCollapsibleNavGroup,
	EuiListGroup,
	EuiListGroupItem,
	EuiText,
	useEuiTheme,
	useIsWithinMinBreakpoint,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useCallback, useMemo, useState } from 'react';
import { SearchBox } from './SearchBox';
import { brandColours } from './sharedStyles';
import type { Query } from './sharedTypes';
import { useSearch } from './useSearch';

function decideLabelForQueryBadge(query: Query): string {
	const { supplier, q, bucket } = query;
	const supplierLabel = supplier?.join(', ') ?? '';
	const qLabel = q.length > 0 ? `"${q}"` : '';
	const bucketLabel = bucket ? `[${bucketName(bucket)}]` : '';
	const labels = [bucketLabel, supplierLabel, qLabel];
	return labels.filter((label) => label.length > 0).join(' ');
}

const recognisedSuppliers = ['REUTERS', 'AP', 'AAP', 'PA'];
const buckets = [
	{ id: 'no-sports', name: 'No Sports' },
	{ id: 'pa-home', name: 'PA Home' },
	{ id: 'us-election', name: 'US Election' },
	{ id: 'ap-world', name: 'AP World' },
];
function bucketName(bucketId: string): string | undefined {
	return buckets.find((bucket) => bucket.id === bucketId)?.name;
}

export const SideNav = ({ dockedByDefault }: { dockedByDefault: boolean }) => {
	const [navIsOpen, setNavIsOpen] = useState<boolean>(false);
	const theme = useEuiTheme();
	const isOnLargerScreen = useIsWithinMinBreakpoint('m');

	const { state, config, handleEnterQuery, toggleAutoUpdate } = useSearch();

	const searchHistory = state.successfulQueryHistory;
	const activeSuppliers = useMemo(
		() => config.query.supplier ?? [],
		[config.query.supplier],
	);

	const activeBucket = config.query.bucket;

	const searchHistoryItems = useMemo(
		() =>
			searchHistory.slice(1).map(({ query, resultsCount }) => ({
				label: decideLabelForQueryBadge(query),
				query,
				resultsCount,
			})),
		[searchHistory],
	);

	const toggleSupplier = useCallback(
		(supplier: string) => {
			// If 'activeSuppliers' is empty, that means that *all* suppliers are active.
			if (activeSuppliers.length === 0) {
				handleEnterQuery({
					...config.query,
					supplier: [supplier],
				});
				return;
			}
			const newSuppliers = activeSuppliers.includes(supplier)
				? activeSuppliers.filter((s) => s !== supplier)
				: [...activeSuppliers, supplier];
			handleEnterQuery({
				...config.query,
				// if all the suppliers are active, we don't need to specify them in the query
				supplier: recognisedSuppliers.every((s) => newSuppliers.includes(s))
					? []
					: newSuppliers,
			});
		},
		[config.query, handleEnterQuery, activeSuppliers],
	);

	const supplierItems = useMemo(
		() => [
			{
				label: 'All',
				isActive:
					activeSuppliers.length === 0 ||
					activeSuppliers.length === recognisedSuppliers.length,
				onClick: () => handleEnterQuery({ ...config.query, supplier: [] }),
				colour: theme.colorMode === 'LIGHT' ? 'black' : 'white',
			},
			...recognisedSuppliers.map((supplier) => ({
				label: supplier,
				isActive:
					activeSuppliers.includes(supplier) || activeSuppliers.length === 0,
				colour: brandColours.get(supplier) ?? 'black',
				onClick: () => toggleSupplier(supplier),
			})),
		],
		[
			activeSuppliers,
			config.query,
			handleEnterQuery,
			theme.colorMode,
			toggleSupplier,
		],
	);

	const bucketItems = useMemo(() => {
		const toggleBucket = (bucket: string) =>
			activeBucket === bucket ? undefined : bucket;

		return [
			...buckets.map(({ id: bucketId, name }) => ({
				bucketId,
				label: name,
				isActive: activeBucket === bucketId,
				onClick: () =>
					handleEnterQuery({ ...config.query, bucket: toggleBucket(bucketId) }),
			})),
		];
	}, [activeBucket, config.query, handleEnterQuery]);

	return (
		<>
			<EuiCollapsibleNav
				isOpen={navIsOpen}
				isDocked={dockedByDefault && isOnLargerScreen}
				size={300}
				button={
					<EuiButtonIcon
						aria-label="Toggle main navigation"
						onClick={() => setNavIsOpen((isOpen) => !isOpen)}
						color={'primary'}
						display="base"
						iconType={'menu'}
					/>
				}
				closeButtonProps={{ color: 'warning' }}
				onClose={() => setNavIsOpen(false)}
			>
				<div className="eui-yScroll">
					<SearchBox />
					<EuiCollapsibleNavGroup title="Buckets">
						<EuiListGroup
							maxWidth="none"
							color="subdued"
							gutterSize="none"
							size="s"
						>
							{bucketItems.map(({ bucketId, label, isActive, onClick }) => {
								return (
									<EuiListGroupItem
										color={isActive ? 'primary' : 'subdued'}
										label={label}
										key={bucketId}
										aria-current={isActive}
										onClick={onClick}
										icon={
											<div
												css={css`
													width: 0.5rem;
													height: 1.5rem;
													background-color: ${isActive
														? theme.euiTheme.colors.primary
														: 'transparent'};
												`}
											/>
										}
									/>
								);
							})}
						</EuiListGroup>
					</EuiCollapsibleNavGroup>
					<EuiCollapsibleNavGroup title={'Suppliers'}>
						<EuiListGroup
							maxWidth="none"
							color="subdued"
							gutterSize="none"
							size="s"
						>
							{supplierItems.map(({ label, colour, isActive, onClick }) => {
								return (
									<EuiListGroupItem
										color={isActive ? 'primary' : 'subdued'}
										key={label}
										label={label}
										onClick={onClick}
										icon={
											<div
												css={css`
													width: 0.5rem;
													height: 1.5rem;
													background-color: ${isActive
														? colour
														: 'transparent'};
													opacity: 0.7;
												`}
											/>
										}
										aria-current={isActive}
									/>
								);
							})}
						</EuiListGroup>
					</EuiCollapsibleNavGroup>
					<EuiCollapsibleNavGroup title={'Search history'}>
						{searchHistoryItems.length === 0 ? (
							<EuiText size="s">{'No history yet'}</EuiText>
						) : (
							<EuiBadgeGroup color="subdued" gutterSize="s">
								{searchHistoryItems.map(({ label, query, resultsCount }) => {
									return (
										<EuiBadge
											key={label}
											color="secondary"
											onClick={() => {
												handleEnterQuery(query);
											}}
											onClickAriaLabel="Apply filters"
										>
											{label}{' '}
											<EuiBadge color="hollow">
												{resultsCount === 30 ? '30+' : resultsCount}
											</EuiBadge>
										</EuiBadge>
									);
								})}
							</EuiBadgeGroup>
						)}
					</EuiCollapsibleNavGroup>
				</div>
			</EuiCollapsibleNav>
		</>
	);
};

/** 
 * Feels worth leaving this code here but commented out for a while.
 * I wrote it when adding keywords but we're removing this for the time being.
 * Feels worth having in the code, rather than keeping it in a separate branch, to
 * make it easier to discover. If it's not been used by, say, the end of October 2024
 * then let's delete it.
 * 
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
	const { q, subject } = query;

	if (q.length === 0 && subject.length === 0) {
		return <EuiText size="s">No filters applied</EuiText>;
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
			{subject.map((s) => (
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
*/
