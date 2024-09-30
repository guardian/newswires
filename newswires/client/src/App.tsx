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
import { Item } from './Item';
import { SearchBox } from './SearchBox';
import { isItemPath, useHistory } from './urlState';
import { useSearch } from './useSearch';

export function App() {
	const { currentState, pushState } = useHistory();
	const { searchHistory, currentSearchState, updateSearchQuery } = useSearch();

	const updateQuery = (newQuery: string) => {
		pushState({ location: 'feed', params: { q: newQuery } });
		updateSearchQuery(newQuery);
	};

	const maybeSelectedWireId = useMemo(
		() =>
			isItemPath(currentState.location)
				? currentState.location.replace('item/', '')
				: undefined,
		[currentState.location],
	);

	const nextWireId = useMemo(() => {
		if (currentSearchState.state === 'data') {
			const currentIndex = currentSearchState.data.results.findIndex(
				(wire) => wire.id.toString() === maybeSelectedWireId,
			);
			if (currentIndex === -1) {
				return undefined;
			}
			const nextIndex = currentIndex + 1;
			if (nextIndex >= currentSearchState.data.results.length) {
				return undefined;
			}
			return currentSearchState.data.results[nextIndex].id.toString();
		}
		return undefined;
	}, [currentSearchState, maybeSelectedWireId]);

	const previousWireId = useMemo(() => {
		if (currentSearchState.state === 'data') {
			const currentIndex = currentSearchState.data.results.findIndex(
				(wire) => wire.id.toString() === maybeSelectedWireId,
			);
			if (currentIndex === -1) {
				return undefined;
			}
			const previousIndex = currentIndex - 1;
			if (previousIndex < 0) {
				return undefined;
			}
			return currentSearchState.data.results[previousIndex].id.toString();
		}
		return undefined;
	}, [currentSearchState, maybeSelectedWireId]);

	return (
		<EuiProvider colorMode="light">
			<EuiPageTemplate
				onKeyUp={(e) => {
					if (
						isItemPath(currentState.location) &&
						currentSearchState.state === 'data'
					) {
						switch (e.key) {
							case 'Escape':
								pushState({ location: 'feed', params: currentState.params });
								break;
							case 'ArrowLeft':
								if (previousWireId !== undefined) {
									pushState({
										location: `item/${previousWireId}`,
										params: currentState.params,
									});
								}
								break;
							case 'ArrowRight':
								if (nextWireId !== undefined) {
									pushState({
										location: `item/${nextWireId}`,
										params: currentState.params,
									});
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
					<Feed searchState={currentSearchState} />
				)}
				{isItemPath(currentState.location) && <Item />}
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
