import {
	EuiEmptyPrompt,
	EuiFlexGroup,
	EuiFlexItem,
	EuiLoadingLogo,
	EuiPageTemplate,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';
import { fetchToolLinks } from './context/fetchToolLinks.ts';
import type { SortBy } from './context/SearchContext.tsx';
import {
	isSortByAddedToCollectionAt,
	useSearch,
} from './context/SearchContext.tsx';
import { sortByTimeStamp } from './context/timestamp-compare.ts';
import { DatePicker } from './DatePicker.tsx';
import { ScrollToTopButton } from './ScrollToTopButton.tsx';
import { SearchSummary } from './SearchSummary.tsx';
import type { ToolLink, WireData, WireToolLinks } from './sharedTypes.ts';
import { WireItemList } from './WireItemList.tsx';

export interface FeedProps {
	containerRef?: React.RefObject<HTMLDivElement>;
	direction?: string;
	setSideNavIsOpen: (isOpen: boolean) => void;
}

const baseStyles = css`
	padding-bottom: 12px;
`;

const columnStyles = css`
	flex-direction: column;
`;

type WireSortingFunction = (a: WireData, b: WireData) => number;

function decideSortFunction(sortBy: SortBy): WireSortingFunction {
	if (isSortByAddedToCollectionAt(sortBy)) {
		return (a, b) => {
			const aTimestamp = a.collections.find(
				(c) => c.collectionId === sortBy.collectionId,
			)?.addedAt;
			const bTimestamp = b.collections.find(
				(c) => c.collectionId === sortBy.collectionId,
			)?.addedAt;

			if (aTimestamp && bTimestamp) {
				return sortByTimeStamp({ ascending: false })(aTimestamp, bTimestamp);
			} else if (aTimestamp) {
				return -1; // a comes before b
			} else if (bTimestamp) {
				return 1; // b comes before a
			} else {
				return 0; // maintain original order
			}
		};
	}

	return (a, b) =>
		sortByTimeStamp({ ascending: false })(a.ingestedAt, b.ingestedAt);
}

export const Feed = ({
	containerRef,
	direction,
	setSideNavIsOpen,
}: FeedProps) => {
	const { state, config } = useSearch();
	const { status, queryData } = state;

	const isPoppedOut = config.ticker;

	const [isColumn, setIsColumn] = useState(false);
	const [toolLinksMap, setToolLinks] = useState<Record<number, ToolLink[]>>({});

	useEffect(() => {
		const el = containerRef?.current;
		if (!el) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setIsColumn(entry.contentRect.width < 450);
			}
		});

		observer.observe(el);
		return () => observer.disconnect();
	}, [containerRef]);

	useEffect(() => {
		const intervalId = setInterval(() => {
			if (!queryData) return;
			const wireIds = queryData.results.map((r) => r.id);
			fetchToolLinks(wireIds)
				.then((wireToolLinks: WireToolLinks) => {
					const toolLinksMap = wireToolLinks.reduce<Record<number, ToolLink[]>>(
						(acc, wireToolLink) => ({
							...{
								[wireToolLink.wireId]: wireToolLink.toolLinks,
							},
							...acc,
						}),
						{},
					);
					setToolLinks(toolLinksMap);
				})
				.catch((error) => {
					console.log(`Error contacting the server ${error}`);
				});
		}, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, [queryData]);

	const wires = useMemo(() => {
		if (!queryData) return [];
		const sortFunction = decideSortFunction(state.sortBy);

		return queryData.results
			.map((result) => {
				const toolLinks = toolLinksMap[result.id] ?? [];
				if (toolLinks.length) {
					return {
						...result,
						toolLinks,
					};
				} else return result;
			})
			.sort(sortFunction);
	}, [queryData, state.sortBy, toolLinksMap]);
	return (
		<EuiPageTemplate.Section
			paddingSize={isPoppedOut ? 's' : 'm'}
			css={css`
				padding: 0 0.5rem;
			`}
		>
			{status == 'loading' && (
				<EuiEmptyPrompt
					icon={<EuiLoadingLogo logo="clock" size="l" />}
					title={<h2>Loading Wires</h2>}
				/>
			)}
			{(status == 'success' || status == 'offline') &&
				queryData.results.length === 0 && (
					<>
						<EuiFlexGroup>
							<EuiFlexItem style={{ flex: 1 }}></EuiFlexItem>
							<EuiFlexItem grow={false}>
								<DatePicker />
							</EuiFlexItem>
						</EuiFlexGroup>
						<EuiEmptyPrompt
							body={
								<>
									<SearchSummary setSideNavIsOpen={setSideNavIsOpen} />
									<p>Try another search or reset filters.</p>
								</>
							}
							color="subdued"
							layout="horizontal"
							title={<h2>No results match your search criteria</h2>}
							titleSize="s"
						/>
					</>
				)}
			{(status == 'success' || status == 'offline') &&
				queryData.results.length > 0 && (
					<>
						<div>
							<EuiFlexGroup css={[baseStyles, isColumn && columnStyles]}>
								<EuiFlexItem style={{ flex: 1 }}>
									<SearchSummary setSideNavIsOpen={setSideNavIsOpen} />
								</EuiFlexItem>
								{!isPoppedOut && (
									<EuiFlexItem grow={false}>
										<DatePicker width={isColumn ? 'full' : 'auto'} />
									</EuiFlexItem>
								)}
							</EuiFlexGroup>
						</div>

						<WireItemList wires={wires} totalCount={queryData.totalCount} />

						<ScrollToTopButton
							threshold={300}
							containerRef={containerRef}
							direction={direction}
						/>
					</>
				)}
		</EuiPageTemplate.Section>
	);
};
