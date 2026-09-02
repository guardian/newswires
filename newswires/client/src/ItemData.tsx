import { getErrorMessage } from '@guardian/libs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isBlueskyWireData } from './context/blueskyToWireData.ts';
import { fetchToolLink } from './context/fetchToolLinks.ts';
import { useSearch } from './context/SearchContext.tsx';
import { transformWireItemQueryResult } from './context/transformQueryResponse.ts';
import { Item } from './Item';
import { pandaFetch } from './panda-session';
import type { ToolLink } from './sharedTypes';
import { type WireData, WireDataFromAPISchema } from './sharedTypes';

export const ItemData = ({ id }: { id: string }) => {
	const {
		handleDeselectItem,
		handlePreviousItem,
		handleNextItem,
		config,
		state,
	} = useSearch();

	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	// Bluesky posts only live in the client-side feed, so read them from state
	// rather than fetching from the wires API (which wouldn't know about them).
	const blueskyItem = useMemo(() => {
		const match = state.queryData?.results.find((r) => r.id.toString() === id);
		return match && isBlueskyWireData(match) ? match : undefined;
	}, [state.queryData, id]);

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

	const fetchItemData = useCallback(() => {
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
		if (blueskyItem) {
			setItemData(blueskyItem);
			setError(undefined);
			return;
		}
		fetchItemData();
	}, [id, config.query.q, fetchItemData, blueskyItem]);

	useEffect(() => {
		// Bluesky posts have no tool links to poll for.
		if (blueskyItem) {
			return;
		}
		const intervalId = setInterval(() => {
			fetchToolLink(id)
				.then((toolLinks) => {
					setItemData((prevItem) => {
						if (!prevItem) return;
						return { ...prevItem, toolLinks };
					});
				})
				.catch((error) => {
					console.log(`Error contacting the server ${error}`);
				});
		}, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, [id, setItemData, blueskyItem]);

	return (
		<Item
			itemData={itemData}
			addToolLink={addToolLink}
			error={error}
			handleDeselectItem={handleDeselectItem}
			handlePreviousItem={handlePreviousItem}
			handleNextItem={handleNextItem}
			refreshItemData={fetchItemData}
		/>
	);
};
