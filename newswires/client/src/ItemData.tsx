import { useEffect, useState } from 'react';
import { useSearch } from './context/SearchContext.tsx';
import { Item } from './Item';
import { pandaFetch } from './panda-session';
import { type WireData, WireDataSchema } from './sharedTypes';

export const ItemData = ({ id }: { id: string }) => {
	const {
		handleDeselectItem,
		handlePreviousItem,
		handleNextItem,
		config: {
			query: { q },
		},
	} = useSearch();

	const [itemData, setItemData] = useState<WireData | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		// fetch item data from /api/item/:id
		pandaFetch(`/api/item/${id}${q ? `?q=${q}` : ''}`)
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
	}, [id, q]);

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
