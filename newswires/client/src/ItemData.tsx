import { useEffect, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { transformWireItemQueryResult } from './context/transformQueryResponse.ts';
import { Item } from './Item';
import { pandaFetch } from './panda-session';
import { type WireData, WireDataFromAPISchema } from './sharedTypes';

export const ItemData = ({ id }: { id: string }) => {
	const { handleDeselectItem, handlePreviousItem, handleNextItem, config } =
		useSearch();

	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

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
				console.error(e);
				setError(
					e instanceof Error
						? e.message
						: typeof e === 'string'
							? e
							: 'unknown error',
				);
			});
	}, [id, config.query.q]);

	return (
		<Item
			itemData={itemData}
			error={error}
			handleDeselectItem={handleDeselectItem}
			handlePreviousItem={handlePreviousItem}
			handleNextItem={handleNextItem}
		/>
	);
};
