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
import { SearchSummary } from './SearchSummary.tsx';
import { WireItemList } from './WireItemList.tsx';

export const Feed = () => {
	const { state } = useSearch();
	const { status, queryData } = state;

	return (
		<EuiPageTemplate.Section
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
				)}
			{(status == 'success' || status == 'offline') &&
				queryData.results.length > 0 && (
					<>
						<EuiFlexGroup>
							<EuiFlexItem
								style={{ flex: 1, paddingTop: 20, paddingBottom: 20 }}
							>
								<SearchSummary />
							</EuiFlexItem>
							<EuiFlexItem grow={false}>
								<DatePicker />
							</EuiFlexItem>
						</EuiFlexGroup>

						<WireItemList
							wires={queryData.results}
							totalCount={queryData.totalCount}
						/>
					</>
				)}
		</EuiPageTemplate.Section>
	);
};
