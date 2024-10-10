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
	EuiTitle,
	EuiToolTip,
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
								<EuiToolTip
									position="top"
									content={
										<p>
											Works on any kind of element &mdash; buttons, inputs, you
											name it!
										</p>
									}
								>
									<EuiButtonIcon iconType={'launch'} size="s" />
								</EuiToolTip>
								<EuiButtonIcon iconType={'heart'} size="s" />
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
						<WireDetail wire={itemData} />
					</EuiSplitPanel.Inner>
					<EuiSplitPanel.Inner>
						<EuiButton onClick={() => handleDeselectItem()}>Close</EuiButton>
					</EuiSplitPanel.Inner>
				</>
			)}
		</EuiSplitPanel.Outer>
	);
};

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
	const [showSuccessIcon, setShowSuccessIcon] = useState(false);

	return (
		<EuiToolTip
			position="top"
			content={
				<p>
					Works on any kind of element &mdash; buttons, inputs, you name it!
				</p>
			}
		>
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
					>
						Copy
					</EuiButtonIcon>
				)}
			</EuiCopy>
		</EuiToolTip>
	);
};
