import { EuiPageTemplate, EuiTitle } from '@elastic/eui';
import { Fragment, useEffect, useState } from 'react';
import { type WireData, WireDataSchema } from './sharedTypes';
import { useHistory } from './urlState';
import { WireDetail } from './WireDetail';

export const Item = () => {
	const { currentState } = useHistory();
	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

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
				<Fragment>
					<EuiTitle size="s">
						<h2>{itemData.content.headline}</h2>
					</EuiTitle>
					<WireDetail wire={itemData} />
				</Fragment>
			)}
		</EuiPageTemplate.Section>
	);
};
