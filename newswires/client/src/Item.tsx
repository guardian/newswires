import {
	EuiButton,
	EuiFlyout,
	EuiFlyoutBody,
	EuiFlyoutFooter,
	EuiPageTemplate,
	EuiSpacer,
	EuiTitle,
	useGeneratedHtmlId,
} from '@elastic/eui';
import { useEffect, useState } from 'react';
import { type WireData, WireDataSchema } from './sharedTypes';
import { useHistory } from './urlState';
import { WireDetail } from './WireDetail';

export const Item = () => {
	const { currentState, pushState } = useHistory();
	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	const pushedFlyoutTitleId = useGeneratedHtmlId({
		prefix: 'pushedFlyoutTitle',
	});

	useEffect(() => {
		// fetch item data from /api/item/:id
		fetch(`/api/${currentState.location}`)
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
	}, [currentState.location]);

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
					onClose={() =>
						pushState({ location: 'feed', params: currentState.params })
					}
					closeButtonProps={{
						'aria-label': 'Close wire detail',
					}}
					aria-labelledby={pushedFlyoutTitleId}
				>
					<EuiFlyoutBody>
						<EuiTitle size="s">
							<h2 id={pushedFlyoutTitleId}>{itemData.content.headline}</h2>
						</EuiTitle>
						<EuiSpacer size="xs" />
						<WireDetail wire={itemData} />
					</EuiFlyoutBody>
					<EuiFlyoutFooter>
						<EuiButton
							onClick={() =>
								pushState({ location: 'feed', params: currentState.params })
							}
						>
							Close
						</EuiButton>
					</EuiFlyoutFooter>
				</EuiFlyout>
			)}
		</EuiPageTemplate.Section>
	);
};
