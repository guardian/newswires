import {
	EuiButton,
	EuiButtonIcon,
	EuiFlexGroup,
	EuiHorizontalRule,
	EuiLoadingSpinner,
	EuiSplitPanel,
	EuiSwitch,
	EuiText,
	EuiTitle,
	useIsWithinBreakpoints,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { type ToolLink, type WireData } from './sharedTypes';
import { Tooltip } from './Tooltip.tsx';
import { WireDetail } from './WireDetail';

export const Item = ({
	error,
	itemData,
	handleDeselectItem,
	handlePreviousItem,
	handleNextItem,
	addToolLink,
	refreshItemData,
}: {
	error: string | undefined;
	itemData: WireData | undefined;
	handleDeselectItem: () => void;
	handlePreviousItem: () => void;
	handleNextItem: () => Promise<void>;
	addToolLink: (toolLink: ToolLink) => void;
	refreshItemData: () => void;
}) => {
	const [isShowingJson, setIsShowingJson] = useState<boolean>(false);
	const isSmallScreen = useIsWithinBreakpoints(['xs', 's']);
	const { state } = useSearch();

	const headingRef = useRef<HTMLHeadingElement>(null);

	const isFirst = state.queryData?.results[0]?.id === itemData?.id;
	const isLast =
		state.queryData?.results[state.queryData.totalCount - 1]?.id ===
		itemData?.id;

	// scroll to heading when a new item is selected
	useEffect(() => {
		if (headingRef.current) {
			headingRef.current.scrollIntoView({
				/**
				 * this won't actually put it in the center because there's not
				 * much above the heading, but it makes sure that the panel is fully
				 * scrolled to the top
				 * */
				block: 'center',
			});
		}
	}, [headingRef, itemData?.id]);

	return (
		<EuiSplitPanel.Outer
			direction="column"
			css={css`
				min-height: 100%;
			`}
		>
			{error && (
				<EuiSplitPanel.Inner
					css={css`
						flex: 1;
						display: flex;
						flex-direction: column;
						padding: 16px;
						position: relative;
					`}
				>
					<div
						css={css`
							align-self: flex-end;
						`}
					>
						<Tooltip tooltipContent="Close story" position="left">
							<EuiButtonIcon
								iconType="cross"
								onClick={handleDeselectItem}
								aria-label="Close story"
							/>
						</Tooltip>
					</div>
					<EuiHorizontalRule margin="s" />

					<EuiText textAlign="left">
						<EuiTitle size="xs">
							<h2>Item Not Found</h2>
						</EuiTitle>
						<p>Stories are available for 14 days before being removed.</p>
					</EuiText>
				</EuiSplitPanel.Inner>
			)}
			{!error && itemData && (
				<>
					<EuiSplitPanel.Inner>
						<EuiFlexGroup
							justifyContent="spaceBetween"
							alignItems="center"
							ref={headingRef}
						>
							<Tooltip
								tooltipContent="Previous story"
								position={isSmallScreen ? 'right' : 'top'}
							>
								<EuiButtonIcon
									iconType="arrowLeft"
									onClick={handlePreviousItem}
									aria-label="Previous story"
									disabled={isFirst}
								/>
							</Tooltip>
							{state.loadingMore ? (
								<EuiLoadingSpinner size="m" />
							) : (
								<Tooltip tooltipContent="Next story">
									<EuiButtonIcon
										iconType="arrowRight"
										onClick={() => {
											void handleNextItem();
										}}
										aria-label="Next story"
										disabled={isLast}
									/>
								</Tooltip>
							)}
							<EuiFlexGroup justifyContent="flexEnd" alignItems="center">
								<Tooltip tooltipContent="Close story" position="left">
									<EuiButtonIcon
										iconType="cross"
										onClick={handleDeselectItem}
										aria-label="Close story"
									/>
								</Tooltip>
							</EuiFlexGroup>
						</EuiFlexGroup>
						<EuiHorizontalRule margin="s" />

						<WireDetail
							wire={itemData}
							isShowingJson={isShowingJson}
							addToolLink={addToolLink}
							refreshItemData={refreshItemData}
						/>
					</EuiSplitPanel.Inner>
					<EuiSplitPanel.Inner>
						<EuiFlexGroup justifyContent="spaceBetween">
							<EuiButton onClick={() => handleDeselectItem()}>Close</EuiButton>
							<EuiSwitch
								label="Show JSON"
								checked={isShowingJson}
								onChange={() => setIsShowingJson(!isShowingJson)}
							/>
						</EuiFlexGroup>
					</EuiSplitPanel.Inner>
				</>
			)}
		</EuiSplitPanel.Outer>
	);
};
