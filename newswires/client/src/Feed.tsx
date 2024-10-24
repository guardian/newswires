import { EuiEmptyPrompt, EuiLoadingLogo, EuiPageTemplate } from '@elastic/eui';
import { useSearch } from './useSearch';
import { WireItemTable } from './WireItemTable';

export const Feed = () => {
	const { state } = useSearch();

	const { status, queryData } = state;

	return (
		<EuiPageTemplate.Section paddingSize="none">
			{status == 'loading' && (
				<EuiEmptyPrompt
					icon={<EuiLoadingLogo logo="clock" size="l" />}
					title={<h2>Loading Wires</h2>}
				/>
			)}
			{status == 'success' && queryData.results.length === 0 && (
				<EuiEmptyPrompt
					body={<p>Try a different search term</p>}
					color="subdued"
					layout="horizontal"
					title={<h2>No results match your search criteria</h2>}
					titleSize="s"
				/>
			)}
			{status == 'success' && queryData.results.length > 0 && (
				<WireItemTable wires={queryData.results} />
			)}
		</EuiPageTemplate.Section>
	);
};
