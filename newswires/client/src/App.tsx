import {
	EuiButton,
	EuiEmptyPrompt,
	EuiHeader,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiLink,
	EuiPageTemplate,
	EuiProvider,
	EuiResizableContainer,
	EuiShowFor,
	EuiTitle,
	EuiToast,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useSearch } from './context/SearchContext.tsx';
import { Feed } from './Feed';
import { Item } from './Item';
import { SideNav } from './SideNav';
import { configToUrl, defaultQuery } from './urlState';

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
				{status === 'offline' && (
					<EuiToast
						title="You Are Currently Offline"
						iconType="warning"
						css={css`
							border-radius: 0;
							background: #fdf6d8;
							position: fixed;
						`}
					>
						<p>
							The application is no longer retrieving updates. Data
							synchronization will resume once connectivity is restored.
						</p>
					</EuiToast>
				)}
				<div
					css={css`
						${status === 'offline' && 'padding-top: 84px;'}
						height: 100%;
						${(status === 'loading' || status === 'error') &&
						'display: flex; align-items: center;'}
						${status === 'loading' && 'background: white;'}
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
										<h1>
											<EuiLink
												href="/feed"
												external={false}
												css={css`
													color: inherit;
													font-weight: inherit;
												`}
											>
												Newswires
											</EuiLink>
										</h1>
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
							css={css`
								background: white;
							`}
							actions={[
								<EuiButton
									onClick={handleRetry}
									key="retry"
									iconType={'refresh'}
								>
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
				</div>
			</EuiPageTemplate>
		</EuiProvider>
	);
}
