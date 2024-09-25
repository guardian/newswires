import { EuiEmptyPrompt, EuiLoadingLogo, EuiPageTemplate } from '@elastic/eui';
import type { SearchState } from './useSearch';
import { WireCardList } from './WiresCards';

export const Feed = ({ searchState }: { searchState: SearchState }) => {
	const data = 'data' in searchState ? searchState.data : undefined;

	return (
		<EuiPageTemplate.Section>
			{'error' in searchState && (
				<EuiPageTemplate.EmptyPrompt>
					<p>Sorry, failed to load because of {searchState.error}</p>
				</EuiPageTemplate.EmptyPrompt>
			)}
			{'loading' in searchState && (
				<EuiPageTemplate.EmptyPrompt
					icon={<EuiLoadingLogo logo="clock" size="xl" />}
					title={<h2>Loading Wires</h2>}
				/>
			)}
			{data && data.length === 0 && (
				<EuiEmptyPrompt
					body={<p>Try a different search term</p>}
					color="subdued"
					layout="horizontal"
					title={<h2>No results match your search criteria</h2>}
					titleSize="s"
				/>
			)}
			{data && data.length > 0 && <WireCardList wires={data} />}
		</EuiPageTemplate.Section>
	);
};
