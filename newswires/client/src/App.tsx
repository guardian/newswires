import {
	EuiEmptyPrompt,
	EuiHeader,
	EuiHeaderSectionItem,
	EuiPageTemplate,
	EuiProvider,
	EuiTitle,
} from '@elastic/eui';
import '@elastic/eui/dist/eui_theme_light.css';
import { useMemo } from 'react';
import { Feed } from './Feed';
import { SearchBox } from './SearchBox';
import { useHistory } from './urlState';
import { useSearch } from './useSearch';

export function App() {
	const { searchHistory, updateSearchQuery } = useSearch();
	const { currentState } = useHistory();

	const page = useMemo(() => {
		switch (currentState.location) {
			case 'feed':
				return 'feed';
			default:
				return 'home';
		}
	}, [currentState.location]);

	return (
		<EuiProvider colorMode="light">
			<EuiPageTemplate>
				<EuiHeader position="fixed">
					<EuiHeaderSectionItem>
						<EuiTitle size={'s'}>
							<h1>Newswires</h1>
						</EuiTitle>
					</EuiHeaderSectionItem>
					{page !== 'home' && (
						<EuiHeaderSectionItem>
							<SearchBox
								initialQuery={currentState.params?.q ?? ''}
								update={updateSearchQuery}
								searchHistory={searchHistory}
								incremental={true}
							/>
						</EuiHeaderSectionItem>
					)}
				</EuiHeader>
				{page === 'feed' && <Feed searchState={searchHistory[0]} />}
				{page === 'home' && (
					<EuiEmptyPrompt
						title={<h2>Search wires</h2>}
						body={
							<SearchBox
								initialQuery={currentState.params?.q ?? ''}
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
