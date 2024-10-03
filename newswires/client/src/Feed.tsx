import { EuiEmptyPrompt, EuiLoadingLogo, EuiPageTemplate } from '@elastic/eui';
import type { SearchState } from './useSearch';
import { WireItemTable } from './WireItemTable';

export const Feed = ({
	searchState,
	selectedWireId,
	handleSelectItem,
}: {
	searchState: SearchState;
	selectedWireId: string | undefined;
	handleSelectItem: (id: string | undefined) => void;
}) => {
	const data = 'data' in searchState ? searchState.data : undefined;

	return (
		<EuiPageTemplate.Section>
			{searchState.state == 'error' && (
				<EuiPageTemplate.EmptyPrompt>
					<p>Sorry, failed to load because of {searchState.error}</p>
				</EuiPageTemplate.EmptyPrompt>
			)}
			{searchState.state == 'loading' && (
				<EuiPageTemplate.EmptyPrompt
					icon={<EuiLoadingLogo logo="clock" size="xl" />}
					title={<h2>Loading Wires</h2>}
				/>
			)}
			{data && data.results.length === 0 && (
				<EuiEmptyPrompt
					body={<p>Try a different search term</p>}
					color="subdued"
					layout="horizontal"
					title={<h2>No results match your search criteria</h2>}
					titleSize="s"
				/>
			)}
			{data && data.results.length > 0 && (
				<WireItemTable
					wires={data.results}
					selectedWireId={selectedWireId}
					handleSelectItem={handleSelectItem}
				/>
			)}
		</EuiPageTemplate.Section>
	);
};
