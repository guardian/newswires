import {
	EuiButton,
	EuiEmptyPrompt,
	EuiHeader,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiLoadingLogo,
	EuiPageTemplate,
	EuiProvider,
	EuiSpacer,
	EuiTitle,
} from '@elastic/eui';
import '@elastic/eui/dist/eui_theme_light.css';
import { css } from '@emotion/react';
import { Feed } from './Feed';
import { Item } from './Item';
import { Nav } from './Nav';
import { SearchBox } from './SearchBox';
import { useSearch } from './useSearch';

export function App() {
	const {
		config,
		state,
		handleEnterQuery,
		handleRetry,
		handleDeselectItem,
		handleNextItem,
		handlePreviousItem,
	} = useSearch();

	const { view, query, itemId: selectedItemId } = config;
	const { successfulQueryHistory, status, queryData } = state;

	return (
		<EuiProvider colorMode="light">
			<EuiPageTemplate
				onKeyUp={(e) => {
					if (view == 'item') {
						switch (e.key) {
							case 'Escape':
								handleDeselectItem();
								break;
							case 'ArrowLeft':
								handlePreviousItem();
								break;
							case 'ArrowRight':
								handleNextItem();
								break;
						}
					}
				}}
			>
				<EuiHeader position="fixed">
					<EuiHeaderSection>
						<EuiHeaderSectionItem>
							<Nav />
						</EuiHeaderSectionItem>
						<div
							css={css`
								min-width: 5px;
							`}
						/>
						<EuiHeaderSectionItem>
							<EuiTitle size={'s'}>
								<h1>Newswires</h1>
							</EuiTitle>
						</EuiHeaderSectionItem>
					</EuiHeaderSection>
					<EuiHeaderSection>
						<EuiHeaderSectionItem>
							<SearchBox
								initialQuery={query}
								searchHistory={successfulQueryHistory}
								update={handleEnterQuery}
								incremental={true}
							/>
						</EuiHeaderSectionItem>
					</EuiHeaderSection>
				</EuiHeader>
				{status == 'error' && (
					<EuiEmptyPrompt
						actions={[
							<EuiButton onClick={handleRetry} key="retry" iconType={'refresh'}>
								Retry
							</EuiButton>,
							<EuiButton
								onClick={() => handleEnterQuery({ q: '' })}
								key="clear"
								iconType={'cross'}
							>
								Clear
							</EuiButton>,
						]}
						body={<p>Sorry, failed to load because of {state.error}</p>}
						hasBorder={true}
					/>
				)}
				{status == 'loading' && (
					<EuiEmptyPrompt
						icon={<EuiLoadingLogo logo="clock" size="l" />}
						title={<h2>Loading Wires</h2>}
					/>
				)}{' '}
				{status == 'success' && <Feed items={queryData.results} />}
				{view == 'item' && <Item id={selectedItemId} />}
			</EuiPageTemplate>
		</EuiProvider>
	);
}
