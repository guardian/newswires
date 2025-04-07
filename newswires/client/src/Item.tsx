import {
	EuiButton,
	EuiButtonIcon,
	EuiFlexGroup,
	EuiHorizontalRule,
	EuiPageTemplate,
	EuiSplitPanel,
	EuiSwitch,
	useIsWithinBreakpoints,
} from '@elastic/eui';
import { useState } from 'react';
import { type WireData } from './sharedTypes';
import { Tooltip } from './Tooltip.tsx';
import { WireDetail } from './WireDetail';

export const Item = ({
	error,
	itemData,
	handleDeselectItem,
	handlePreviousItem,
	handleNextItem,
}: {
	error: string | undefined;
	itemData: WireData | undefined;
	handleDeselectItem: () => void;
	handlePreviousItem: () => void;
	handleNextItem: () => void;
}) => {
	const [isShowingJson, setIsShowingJson] = useState<boolean>(false);
	const isSmallScreen = useIsWithinBreakpoints(['xs', 's']);

	return (
		<EuiSplitPanel.Outer>
			{error && (
				<EuiPageTemplate.EmptyPrompt>
					<p>{error}</p>
				</EuiPageTemplate.EmptyPrompt>
			)}
			{itemData && (
				<>
					<EuiSplitPanel.Inner>
						<EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
							<Tooltip
								tooltipContent="Previous story"
								position={isSmallScreen ? 'right' : 'top'}
							>
								<EuiButtonIcon
									iconType="arrowLeft"
									onClick={handlePreviousItem}
									aria-label="Previous story"
								/>
							</Tooltip>
							<Tooltip tooltipContent="Next story">
								<EuiButtonIcon
									iconType="arrowRight"
									onClick={handleNextItem}
									aria-label="Next story"
								/>
							</Tooltip>
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

						<WireDetail wire={itemData} isShowingJson={isShowingJson} />
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
