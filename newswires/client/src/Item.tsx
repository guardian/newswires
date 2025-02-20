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
	EuiText,
	EuiTitle,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { useEffect, useMemo, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { pandaFetch } from './panda-session';
import { type WireData, WireDataSchema } from './sharedTypes';
import { paramsToQuerystring } from './urlState';
import { WireDetail } from './WireDetail';

function decideTitleContentForItem(wire: WireData) {
	const { slug, headline } = wire.content;

	if (headline && headline.length > 0) {
		return (
			<>
				{slug && <EuiText size={'xs'}>{slug}</EuiText>} {headline}
			</>
		);
	}

	return <>{slug ?? 'No title'}</>;
}

export const Item = ({ id }: { id: string }) => {
	const { handleDeselectItem, config } = useSearch();

	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	const currentUrl = window.location.href;
	const [isShowingJson, setIsShowingJson] = useState<boolean>(false);

	const pushedFlyoutTitleId = useGeneratedHtmlId({
		prefix: 'pushedFlyoutTitle',
	});

	const maybeSearchParams = useMemo(() => {
		const q = config.query.q;
		if (q) {
			return paramsToQuerystring({ q, supplier: [] });
		}
		return '';
	}, [config.query.q]);

	useEffect(() => {
		// fetch item data from /api/item/:id
		pandaFetch(`/api/item/${id}${maybeSearchParams}`)
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
								<EuiButtonIcon iconType={'heart'} aria-label="save" size="s" />
								<CopyButton textToCopy={currentUrl} />
							</EuiFlexGroup>
						</EuiFlexGroup>
						<EuiHorizontalRule margin="s" />
						<EuiFlexGroup justifyContent="spaceBetween">
							<EuiFlexItem grow={true}>
								<EuiTitle size="xs">
									<h2 id={pushedFlyoutTitleId}>
										{decideTitleContentForItem(itemData)}
									</h2>
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
