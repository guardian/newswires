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
import { useSearch } from './useSearch';

export function App() {
	const {
		searchHistory,
		currentSearchState,
		updateSearchQuery,
		selectedItemId,
		handleSelectItem,
		nextWireId,
		previousWireId,
	} = useSearch();

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
					{currentSearchState.state !== 'initialised' && (
						<EuiHeaderSectionItem>
							<SearchBox
								initialQuery={currentSearchState.query}
								searchHistory={searchHistory}
								update={updateSearchQuery}
								incremental={true}
							/>
						</EuiHeaderSectionItem>
					)}
				</EuiHeader>
				{currentSearchState.state !== 'initialised' && (
					<Feed
						searchState={currentSearchState}
						selectedWireId={selectedItemId}
						handleSelectItem={handleSelectItem}
					/>
				)}
				{selectedItemId !== undefined && (
					<Item id={selectedItemId} handleSelectItem={handleSelectItem} />
				)}
				{currentSearchState.state === 'initialised' && (
					<EuiEmptyPrompt
						title={<h2>Search wires</h2>}
						body={
							<SearchBox
								initialQuery={''}
								searchHistory={searchHistory}
								update={updateSearchQuery}
							/>
						}
					/>
				)}
			</EuiPageTemplate>
		</EuiProvider>
	);
}
