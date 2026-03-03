import { EuiButtonIcon } from '@elastic/eui';
import { useCallback } from 'react';
import { CollectionsIcon } from './icons/CollectionsIcon';
import { CollectionsOutlineIcon } from './icons/CollectionsOutlineIcon';
import { pandaFetch } from './panda-session';
import { TASTED_COLLECTION_ID } from './presets';
import { Tooltip } from './Tooltip';

export function AddToCollectionButton({
	wireId,
	isInTastedCollection,
	refreshItemData,
}: {
	wireId: string;
	isInTastedCollection: boolean;
	refreshItemData: () => void;
}) {
	const toggleItemToTasted = useCallback((): void => {
		const url = isInTastedCollection
			? `/api/collections/${TASTED_COLLECTION_ID}/remove-item/${wireId}`
			: `/api/collections/${TASTED_COLLECTION_ID}/add-item/${wireId}`;
		pandaFetch(url, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
			},
		})
			.then(() => refreshItemData())
			.catch(console.error);
	}, [isInTastedCollection, refreshItemData, wireId]);

	return (
		<Tooltip
			tooltipContent={
				isInTastedCollection
					? "Remove from 'Tasted' list"
					: "Add to 'Tasted' list"
			}
		>
			<EuiButtonIcon
				iconType={
					isInTastedCollection ? CollectionsIcon : CollectionsOutlineIcon
				}
				iconSize="xxl"
				onClick={toggleItemToTasted}
				aria-label={
					isInTastedCollection
						? "Remove from 'Tasted' list"
						: "Add to 'Tasted' list"
				}
				size="s"
			></EuiButtonIcon>
		</Tooltip>
	);
}
