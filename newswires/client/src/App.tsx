import {
	EuiEmptyPrompt,
	EuiHeader,
	EuiHeaderSectionItem,
	EuiPageTemplate,
	EuiProvider,
	EuiTitle,
} from '@elastic/eui';
import '@elastic/eui/dist/eui_theme_light.css';
import { Feed } from './Feed';
import { Item } from './Item';
import { SearchBox } from './SearchBox';
import { isItemPath, useHistory } from './urlState';
import { useSearch } from './useSearch';

export function App() {
	const { currentState, pushState } = useHistory();
	const {
		searchHistory,
		currentSearchState,
		updateSearchQuery,
		selectedItemId,
		handleSelectItem,
		nextWireId,
		previousWireId,
	} = useSearch();

	const updateQuery = (newQuery: string) => {
		pushState({ location: 'feed', params: { q: newQuery } });
		updateSearchQuery(newQuery);
	};

	return (
		<EuiProvider colorMode="light">
			<EuiPageTemplate
				onKeyUp={(e) => {
					if (selectedItemId !== undefined) {
						switch (e.key) {
							case 'Escape':
								handleSelectItem(undefined);
								break;
							case 'ArrowLeft':
								if (previousWireId !== undefined) {
									handleSelectItem(previousWireId);
								}
								break;
							case 'ArrowRight':
								if (nextWireId !== undefined) {
									handleSelectItem(nextWireId);
								}
								break;
						}
					}
				}}
			>
				<EuiHeader position="fixed">
					<EuiHeaderSectionItem>
						<EuiTitle size={'s'}>
							<h1>Newswires</h1>
						</EuiTitle>
					</EuiHeaderSectionItem>
					{currentState.location !== '' && (
						<EuiHeaderSectionItem>
							<SearchBox
								initialQuery={currentState.params?.q ?? ''}
								searchHistory={searchHistory}
								update={updateSearchQuery}
								incremental={true}
							/>
						</EuiHeaderSectionItem>
					)}
				</EuiHeader>
				{(currentState.location === 'feed' ||
					isItemPath(currentState.location)) && (
					<Feed
						searchState={currentSearchState}
						selectedWireId={selectedItemId}
						handleSelectItem={handleSelectItem}
					/>
				)}
				{selectedItemId !== undefined && (
					<Item id={selectedItemId} handleSelectItem={handleSelectItem} />
				)}
				{currentState.location === '' && (
					<EuiEmptyPrompt
						title={<h2>Search wires</h2>}
						body={
							<SearchBox
								initialQuery={currentState.params?.q ?? ''}
								searchHistory={searchHistory}
								update={updateQuery}
							/>
						}
					/>
				)}
			</EuiPageTemplate>
		</EuiProvider>
	);
}
