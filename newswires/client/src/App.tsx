import {
	EuiHeader,
	EuiHeaderSectionItem,
	EuiPageTemplate,
	EuiProvider,
	EuiTitle,
} from '@elastic/eui';
import '@elastic/eui/dist/eui_theme_light.css';
import { Feed } from './Feed';
import { Home } from './Home';
import { SearchBox } from './SearchBox';
import { useHistory } from './urlState';

export function App() {
	const { currentState, pushState } = useHistory();

	const updateQuery = (newQuery: string) => {
		pushState({ location: 'feed', params: { q: newQuery } });
	};

	return (
		<EuiProvider colorMode="light">
			<EuiPageTemplate>
				<EuiHeader position="fixed">
					<EuiHeaderSectionItem>
						<EuiTitle size={'s'}>
							<a href="/">
								<h1>Newswires</h1>
							</a>
						</EuiTitle>
					</EuiHeaderSectionItem>
					{currentState.location !== '' && (
						<EuiHeaderSectionItem>
							<SearchBox
								initialQuery={currentState.params?.q ?? ''}
								update={updateQuery}
								incremental={true}
							/>
						</EuiHeaderSectionItem>
					)}
				</EuiHeader>
				{currentState.location === 'feed' && (
					<Feed searchQuery={currentState.params?.q ?? ''} />
				)}
				{currentState.location === '' && <Home updateQuery={updateQuery} />}
			</EuiPageTemplate>
		</EuiProvider>
	);
}
