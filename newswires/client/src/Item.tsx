import {
	EuiButton,
	EuiButtonIcon,
	EuiCopy,
	EuiFlexGroup,
	EuiFlexItem,
	EuiHorizontalRule,
	EuiPageTemplate,
	EuiSpacer,
	EuiSplitPanel,
	EuiSwitch,
	EuiTitle,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { useEffect, useMemo, useState } from 'react';
import { type WireData, WireDataSchema } from './sharedTypes';
import { useSearch } from './useSearch';
import { WireDetail } from './WireDetail';

export const Item = ({ id }: { id: string }) => {
	const { handleDeselectItem } = useSearch();

	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	const currentUrl = useMemo(() => window.location.href, []);
	const [isShowingJson, setIsShowingJson] = useState<boolean>(false);

	const pushedFlyoutTitleId = useGeneratedHtmlId({
		prefix: 'pushedFlyoutTitle',
	});

	useEffect(() => {
		// fetch item data from /api/item/:id
		fetch(`/api/item/${id}`)
			.then((res) => {
				if (res.status === 404) {
					throw new Error('Item not found');
				}
				if (!res.ok) {
					throw new Error('Failed to fetch data');
				}
				return res.json();
			})
			.then((data) => {
				const maybeWireData = WireDataSchema.safeParse(data);
				if (maybeWireData.success) {
					setError(undefined);
					setItemData(maybeWireData.data);
				} else {
					setError('Invalid data received');
				}
			})
			.catch((e) => {
				console.error(e);
				setError(
					e instanceof Error
						? e.message
						: typeof e === 'string'
							? e
							: 'unknown error',
				);
			});
	}, [id]);

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
							/>
							<EuiFlexGroup justifyContent="flexEnd" alignItems="center">
								<EuiButtonIcon
									iconType={'launch'}
									aria-label="send to composer"
									size="s"
								/>
								<EuiButtonIcon iconType={'heart'} aria-label="save" size="s" />
								<CopyButton textToCopy={currentUrl} />
							</EuiFlexGroup>
						</EuiFlexGroup>
						<EuiHorizontalRule margin="s" />
						<EuiFlexGroup justifyContent="spaceBetween">
							<EuiFlexItem grow={true}>
								<EuiTitle size="xs">
									<h2 id={pushedFlyoutTitleId}>{itemData.content.headline}</h2>
								</EuiTitle>
							</EuiFlexItem>
						</EuiFlexGroup>
						<EuiSpacer size="xs" />
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

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
	const [showSuccessIcon, setShowSuccessIcon] = useState(false);

	return (
		/**
		 * @todo: work out why EuiToolTip is not working
		 */
		<EuiCopy textToCopy={textToCopy}>
			{(copy) => (
				<EuiButtonIcon
					iconType={showSuccessIcon ? 'check' : 'link'}
					size="s"
					onClick={() => {
						copy();
						setShowSuccessIcon(true);
						setInterval(() => setShowSuccessIcon(false), 2000);
					}}
					aria-label="Copy link to clipboard"
				>
					Copy
				</EuiButtonIcon>
			)}
		</EuiCopy>
	);
};
