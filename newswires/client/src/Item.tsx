import {
	EuiButton,
	EuiFlyout,
	EuiFlyoutBody,
	EuiFlyoutFooter,
	EuiPageTemplate,
	EuiSpacer,
	EuiSwitch,
	EuiTitle,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { type WireData, WireDataSchema } from './sharedTypes';
import { useSearch } from './useSearch';
import { WireDetail } from './WireDetail';

export const Item = ({ id }: { id: string }) => {
	const { handleDeselectItem } = useSearch();

	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);
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
		<EuiPageTemplate.Section>
			{error && (
				<EuiPageTemplate.EmptyPrompt>
					<p>{error}</p>
				</EuiPageTemplate.EmptyPrompt>
			)}
			{itemData && (
				<EuiFlyout
					type="push"
					size="m"
					onClose={() => handleDeselectItem()}
					closeButtonProps={{
						'aria-label': 'Close wire detail',
						autoFocus: true,
					}}
					aria-labelledby={pushedFlyoutTitleId}
				>
					<EuiFlyoutBody>
						<EuiTitle size="s">
							<h2 id={pushedFlyoutTitleId}>{itemData.content.headline}</h2>
						</EuiTitle>
						<EuiSpacer size="xs" />
						<WireDetail wire={itemData} isShowingJson={isShowingJson} />
					</EuiFlyoutBody>
					<EuiFlyoutFooter
						css={css`
							display: flex;
							justify-content: space-between;
						`}
					>
						<EuiButton onClick={() => handleDeselectItem()}>Close</EuiButton>
						<EuiSwitch
							label="Show JSON"
							checked={isShowingJson}
							onChange={() => setIsShowingJson(!isShowingJson)}
						/>
					</EuiFlyoutFooter>
				</EuiFlyout>
			)}
		</EuiPageTemplate.Section>
	);
};
