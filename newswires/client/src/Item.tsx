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
}: {
	error: string | undefined;
	itemData: WireData | undefined;
	handleDeselectItem: () => void;
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
								onClick={handleDeselectItem}
								aria-contro
							/>
							<EuiFlexGroup
								justifyContent="flexEnd"
								alignItems="center"
							></EuiFlexGroup>
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
