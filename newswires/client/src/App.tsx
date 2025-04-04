import {
	EuiBetaBadge,
	EuiButton,
	EuiButtonEmpty,
	EuiEmptyPrompt,
	EuiHeader,
	EuiHeaderSection,
	EuiHeaderSectionItem,
	EuiIcon,
	EuiLink,
	EuiModal,
	EuiModalBody,
	EuiModalFooter,
	EuiModalHeader,
	EuiModalHeaderTitle,
	EuiPageTemplate,
	EuiProvider,
	EuiResizableContainer,
	EuiShowFor,
	EuiText,
	EuiTitle,
	EuiToast,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useState } from 'react';
import { z } from 'zod';
import {
	loadOrSetInLocalStorage,
	saveToLocalStorage,
} from './context/localStorage.tsx';
import { useSearch } from './context/SearchContext.tsx';
import { isRestricted } from './dateHelpers.ts';
import { Feed } from './Feed';
import { FeedbackContent } from './FeedbackContent.tsx';
import { ItemData } from './ItemData.tsx';
import { SideNav } from './SideNav';
import { configToUrl, defaultQuery } from './urlState';

const Alert = ({
	title,
	icon = 'warning',
	children,
}: {
	title: string;
	icon?: string;
	children: React.ReactNode;
}) => (
	<EuiToast
		title={title}
		iconType={icon}
		css={css`
			border-radius: 0;
			background: #fdf6d8;
			position: fixed;
		`}
	>
		<p>{children}</p>
	</EuiToast>
);

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

	const [displayDisclaimer, setDisplayDisclaimer] = useState<boolean>(() =>
		loadOrSetInLocalStorage<boolean>('displayDisclaimer', z.boolean(), true),
	);

	const { view, itemId: selectedItemId, query } = config;
	const { status } = state;

	const isPoppedOut = !!window.opener;

	const dismissDisclaimer = (persist?: boolean) => {
		setDisplayDisclaimer(false);
		persist && saveToLocalStorage<boolean>('displayDisclaimer', false);
	};

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
				{displayDisclaimer && (
					<EuiModal
						aria-labelledby="disclaimer-title"
						onClose={() => dismissDisclaimer()}
					>
						<EuiModalHeader>
							<EuiModalHeaderTitle
								title={'Please use with caution'}
								id="disclaimer-title"
							>
								<EuiIcon type="iInCircle" size="xl" /> Please use with caution
							</EuiModalHeaderTitle>
						</EuiModalHeader>

						<EuiModalBody>
							<EuiText size="m">
								Please be advised that this product is currently in its early
								testing phase, under active development, and subject to change.
								<br />
								<FeedbackContent />
							</EuiText>
						</EuiModalBody>

						<EuiModalFooter>
							<EuiButtonEmpty onClick={() => dismissDisclaimer()}>
								Close
							</EuiButtonEmpty>
							<EuiButton onClick={() => dismissDisclaimer(true)} fill>
								Don&apos;t show again
							</EuiButton>
						</EuiModalFooter>
					</EuiModal>
				)}
				{status === 'offline' && (
					<Alert title="You Are Currently Offline">
						The application is no longer retrieving updates. Data
						synchronization will resume once connectivity is restored.
					</Alert>
				)}
				{isRestricted(query.dateRange?.end) &&
					status !== 'offline' &&
					status !== 'error' && (
						<Alert title="Restricted">
							Your current filter settings exclude recent updates. Adjust the
							filter to see the latest data.
						</Alert>
					)}
				<div
					css={css`
						${(status === 'offline' || isRestricted(query.dateRange?.end)) &&
						'padding-top: 84px;'}
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
									<SideNav />
								</EuiHeaderSectionItem>
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
											<EuiBetaBadge
												label="Under construction"
												color={'accent'}
												size="s"
												css={css`
													margin-left: 8px;
												`}
											></EuiBetaBadge>
										</h1>
									</EuiTitle>
								</EuiHeaderSectionItem>
							</EuiHeaderSection>

							<EuiHeaderSectionItem>
								<EuiButton
									css={css`
										margin-left: 8px;
									`}
									size="s"
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
							</EuiHeaderSectionItem>
						</EuiHeader>
					)}
					{status !== 'error' && (
						<>
							<EuiShowFor sizes={['xs', 's']}>
								{view === 'item' ? <ItemData id={selectedItemId} /> : <Feed />}
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
													css={css`
														padding: 0;
														padding-right: 0.5rem;
													`}
												>
													<Feed />
												</EuiResizablePanel>
												<EuiResizableButton />
												<EuiResizablePanel
													minSize="30%"
													initialSize={100}
													className="eui-yScroll"
													css={css`
														padding: 0.5rem;
													`}
												>
													<ItemData id={selectedItemId} />
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
