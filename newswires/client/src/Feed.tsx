import {
	EuiEmptyPrompt,
	EuiFlexGroup,
	EuiFlexItem,
	EuiLoadingLogo,
	EuiPageTemplate,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useSearch } from './context/SearchContext.tsx';
import { DatePicker } from './DatePicker.tsx';
import { ScrollToTopButton } from './ScrollToTopButton.tsx';
import { SearchSummary } from './SearchSummary.tsx';
import { WireItemList } from './WireItemList.tsx';

export interface FeedProps {
	containerRef?: React.RefObject<HTMLDivElement>;
	direction?: string;
}

export const Feed = ({ containerRef, direction }: FeedProps) => {
	const { state, config } = useSearch();
	const { status, queryData } = state;

	const isPoppedOut = config.ticker;

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
									<SearchSummary />
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
							<EuiFlexGroup
								css={css`
									padding-bottom: 12px;
								`}
							>
								<EuiFlexItem style={{ flex: 1 }}>
									<SearchSummary />
								</EuiFlexItem>
								{!isPoppedOut && (
									<EuiFlexItem grow={false}>
										<DatePicker />
									</EuiFlexItem>
								)}
							</EuiFlexGroup>
						</div>

						<WireItemList
							wires={queryData.results}
							totalCount={queryData.totalCount}
						/>

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
