import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../shared/getErrorMessage.ts';
import { fetchToolLinks } from './context/fetchResults.ts';
import { useSearch } from './context/SearchContext.tsx';
import { transformWireItemQueryResult } from './context/transformQueryResponse.ts';
import { Item } from './Item';
import { pandaFetch } from './panda-session';
import type { ToolLink } from './sharedTypes';
import { type WireData, WireDataFromAPISchema } from './sharedTypes';

export const ItemData = ({ id }: { id: string }) => {
	const { handleDeselectItem, handlePreviousItem, handleNextItem, config } =
		useSearch();

	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	const addToolLink = useCallback(
		(toolLink: ToolLink) => {
			setItemData((prevItem) => {
				if (!prevItem) return;
				const links: ToolLink[] = [...(prevItem.toolLinks ?? []), toolLink];
				return { ...prevItem, toolLinks: links };
			});
		},
		[setItemData],
	);

	useEffect(() => {
		// fetch item data from /api/item/:id
		const queryParams = config.query.q
			? `?${new URLSearchParams([['q', config.query.q]]).toString()}`
			: '';

		pandaFetch(`/api/item/${id}${queryParams}`)
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
				const maybeWireData = WireDataFromAPISchema.safeParse(data);
				if (maybeWireData.success) {
					setError(undefined);
					setItemData(transformWireItemQueryResult(maybeWireData.data));
				} else {
					setError('Invalid data received');
				}
			})
			.catch((e) => {
				const errorMessage = getErrorMessage(e);
				console.error(errorMessage);
				setError(errorMessage);
			});
	}, [id, config.query.q]);

	useEffect(() => {
		const intervalId = setInterval(() => {
			fetchToolLinks([id])
				.then((wireToolLinks) => {
					setItemData((prevItem) => {
						if (!prevItem) return;
						if (wireToolLinks.length) {
							const toolLinks = wireToolLinks[0].toolLinks;
							return { ...prevItem, toolLinks };
						}
						return { ...prevItem };
					});
				})
				.catch((error) => {
					console.log(`Error contacting the server ${error}`);
				});
		}, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, [id, setItemData]);

	return (
		<Item
			itemData={itemData}
			addToolLink={addToolLink}
			error={error}
			handleDeselectItem={handleDeselectItem}
			handlePreviousItem={handlePreviousItem}
			handleNextItem={handleNextItem}
		/>
	);
};
