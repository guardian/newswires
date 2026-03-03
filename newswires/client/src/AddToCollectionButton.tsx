import { EuiButtonIcon } from '@elastic/eui';
import { getErrorMessage } from '@guardian/libs';
import { useCallback, useState } from 'react';
import { CollectionsIcon } from './icons/CollectionsIcon';
import { CollectionsOutlineIcon } from './icons/CollectionsOutlineIcon';
import { pandaFetch } from './panda-session';
import { TASTED_COLLECTION } from './presets';
import { Tooltip } from './Tooltip';

function decideLabel(
	isInCollection: boolean,
	errorMessage: string | undefined,
): string {
	if (errorMessage) {
		return errorMessage;
	}
	return isInCollection ? "Remove from 'Tasted' list" : "Add to 'Tasted' list";
}

export function AddToCollectionButton({
	wireId,
	isInTastedCollection,
	refreshItemData,
}: {
	wireId: string;
	isInTastedCollection: boolean;
	refreshItemData: () => void;
}) {
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);

	const toggleItemToTasted = useCallback((): void => {
		const url = isInTastedCollection
			? `/api/collections/${TASTED_COLLECTION.id}/remove-item/${wireId}`
			: `/api/collections/${TASTED_COLLECTION.id}/add-item/${wireId}`;
		pandaFetch(url, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
			},
		})
			.then((resp) => {
				if (resp.ok) {
					refreshItemData();
					setErrorMessage(undefined);
				} else {
					throw new Error(
						`Failed to toggle item in Tasted collection: ${resp.statusText}`,
					);
				}
			})
			.catch((e) => {
				setErrorMessage(
					`Failed to ${isInTastedCollection ? 'remove from' : 'add to'} Tasted collection. Please try refreshing the page if it continues to not work.`,
				);
				console.error(
					`Network error when toggling item in Tasted collection: ${getErrorMessage(e)}`,
				);
			});
	}, [isInTastedCollection, refreshItemData, wireId]);

	return (
		<Tooltip tooltipContent={decideLabel(isInTastedCollection, errorMessage)}>
			<EuiButtonIcon
				iconType={
					errorMessage
						? 'warning'
						: isInTastedCollection
							? CollectionsIcon
							: CollectionsOutlineIcon
				}
				onClick={toggleItemToTasted}
				aria-label={decideLabel(isInTastedCollection, errorMessage)}
				size="s"
				color={errorMessage ? 'danger' : 'primary'}
			></EuiButtonIcon>
		</Tooltip>
	);
}
