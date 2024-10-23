import {
	EuiButton,
	EuiEmptyPrompt,
	EuiFlexGroup,
	EuiFlexItem,
	EuiHeader,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiPageTemplate,
	EuiProvider,
	EuiResizableContainer,
	EuiShowFor,
	EuiSpacer,
	EuiSwitch,
	EuiTitle,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { Feed } from './Feed';
import { Item } from './Item';
import { SideNav } from './SideNav';
import { configToUrl, defaultQuery } from './urlState';
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
		toggleAutoUpdate,
	} = useSearch();

	const { view, itemId: selectedItemId } = config;
	const { status } = state;

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
						<EuiHeaderSection>
							<EuiHeaderSectionItem>
								<EuiTitle
									size={'s'}
									css={css`
										padding-bottom: 3px;
									`}
								>
									<h1>Newswires</h1>
								</EuiTitle>
							</EuiHeaderSectionItem>
							<EuiHeaderSectionItem>
								<SideNav />
							</EuiHeaderSectionItem>
						</EuiHeaderSection>
						<EuiHeaderSectionItem>
							{
								<EuiButton
									iconType={'popout'}
									onClick={() =>
										window.open(
											configToUrl({
												...config,
												view: 'feed',
												itemId: undefined,
											}),
											'_blank',
											'popout=true,width=400,height=800,top=200,location=no,menubar=no,toolbar=no',
										)
									}
								>
									New ticker
								</EuiButton>
							}
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
