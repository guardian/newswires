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
	const { searchHistory, updateSearchQuery } = useSearch();

	const updateQuery = (newQuery: string) => {
		pushState({ location: 'feed', params: { q: newQuery } });
	};

	return (
		<EuiProvider colorMode="light">
			<EuiPageTemplate>
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
								update={updateSearchQuery}
								incremental={true}
							/>
						</EuiHeaderSectionItem>
					)}
				</EuiHeader>
				{currentState.location === 'feed' && (
					<Feed searchState={searchHistory[0]} />
				)}
				{isItemPath(currentState.location) && <Item />}
				{currentState.location === '' && (
					<EuiEmptyPrompt
						title={<h2>Search wires</h2>}
						body={
							<SearchBox
								initialQuery={currentState.params?.q ?? ''}
								update={updateQuery}
							/>
						}
					/>
				)}
			</EuiPageTemplate>
		</EuiProvider>
	);
}
