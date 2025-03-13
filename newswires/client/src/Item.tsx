import {
	EuiButton,
	EuiButtonIcon,
	EuiFlexGroup,
	EuiHorizontalRule,
	EuiPageTemplate,
	EuiSplitPanel,
	EuiSwitch,
} from '@elastic/eui';
import { useState } from 'react';
import { type WireData } from './sharedTypes';
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
							<EuiButtonIcon
								iconType="arrowLeft"
								onClick={handlePreviousItem}
								aria-label="Previous story"
							/>
							<EuiButtonIcon
								iconType="arrowRight"
								onClick={handleNextItem}
								aria-label="Next story"
							/>
							<EuiFlexGroup justifyContent="flexEnd" alignItems="center">
								<EuiButtonIcon
									iconType="cross"
									onClick={handleDeselectItem}
									aria-label="Close story"
								/>
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
