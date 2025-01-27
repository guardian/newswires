import { EuiEmptyPrompt, EuiLoadingLogo, EuiPageTemplate } from '@elastic/eui';
import { useSearch } from './context/SearchContext.tsx';
import { WireItemList } from './WireItemList.tsx';

export const Feed = () => {
	const { state } = useSearch();

	const { status, queryData } = state;

	return (
		<EuiPageTemplate.Section>
			{status == 'loading' && (
				<EuiEmptyPrompt
					icon={<EuiLoadingLogo logo="clock" size="l" />}
					title={<h2>Loading Wires</h2>}
				/>
			)}
			{(status == 'success' || status == 'offline') &&
				queryData.results.length === 0 && (
					<EuiEmptyPrompt
						body={<p>Try a different search term</p>}
						color="subdued"
						layout="horizontal"
						title={<h2>No results match your search criteria</h2>}
						titleSize="s"
					/>
				)}
			{(status == 'success' || status == 'offline') &&
				queryData.results.length > 0 && (
					<WireItemList wires={queryData.results} />
				)}
		</EuiPageTemplate.Section>
	);
};
