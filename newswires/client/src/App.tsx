import {
	EuiButton,
	EuiEmptyPrompt,
	EuiHeader,
	EuiHeaderSectionItem,
	EuiPageTemplate,
	EuiProvider,
	EuiResizableContainer,
	EuiShowFor,
	EuiSpacer,
	EuiTitle,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { Feed } from './Feed';
import { Item } from './Item';
import { SearchBox } from './SearchBox';
import { SideNav } from './SideNav';
import { defaultQuery } from './urlState';
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
	const { successfulQueryHistory, status } = state;

	const isPoppedOut = !!window.opener;

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
				css={css`
					max-height: 100vh;
				`}
			>
				{!isPoppedOut && (
					<EuiHeader position="fixed">
						<EuiHeaderSectionItem>
							<EuiTitle size={'s'}>
								<h1>Newswires</h1>
							</EuiTitle>
							<EuiSpacer size={'s'} />
							<SideNav />
						</EuiHeaderSectionItem>
						<EuiHeaderSectionItem>
							<SearchBox
								initialQuery={query}
								searchHistory={successfulQueryHistory}
								update={handleEnterQuery}
								incremental={true}
							/>
						</EuiHeaderSectionItem>
					</EuiHeader>
				)}
				{status !== 'error' && (
					<>
						<EuiShowFor sizes={['xs', 's']}>
							{view === 'item' ? <Item id={selectedItemId} /> : <Feed />}
						</EuiShowFor>
						<EuiShowFor sizes={['m', 'l', 'xl']}>
							{view === 'item' ? (
								<EuiResizableContainer className="eui-fullHeight">
									{(EuiResizablePanel, EuiResizableButton) => (
										<>
											<EuiResizablePanel
												minSize="25%"
												initialSize={100}
												className="eui-yScroll"
											>
												<Feed />
											</EuiResizablePanel>
											<EuiResizableButton />
											<EuiResizablePanel
												minSize="30%"
												initialSize={100}
												className="eui-yScroll"
											>
												<Item id={selectedItemId} />
											</EuiResizablePanel>
										</>
									)}
								</EuiResizableContainer>
							) : (
								<Feed />
							)}
						</EuiShowFor>
					</>
				)}
				{status == 'error' && (
					<EuiEmptyPrompt
						actions={[
							<EuiButton onClick={handleRetry} key="retry" iconType={'refresh'}>
								Retry
							</EuiButton>,
							<EuiButton
								onClick={() => handleEnterQuery(defaultQuery)}
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
			</EuiPageTemplate>
		</EuiProvider>
	);
}
