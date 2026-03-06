import type { WireData } from '../sharedTypes';
import { isSortByAddedToCollectionAt, type SortBy } from '../sharedTypes';

export function sortByTimeStamp(
	{ ascending }: { ascending: boolean } = { ascending: false },
) {
	if (ascending) {
		return (a: string, b: string) => a.localeCompare(b);
	}
	return (a: string, b: string) => b.localeCompare(a);
}

function sortAndGetFirstItem({
	timestamps,
	ascending,
}: {
	timestamps: string[];
	ascending: boolean;
}): string | undefined {
	if (timestamps.length === 0) {
		return undefined;
	}
	const sorted = timestamps.toSorted(sortByTimeStamp({ ascending }));
	return sorted[0];
}

export function getTimeStamp(
	wire: WireData,
	sortBy: SortBy,
): string | undefined {
	if (isSortByAddedToCollectionAt(sortBy)) {
		const collection = wire.collections.find(
			(c) => c.collectionId === sortBy.collectionId,
		);
		if (collection) {
			return collection.addedAt;
		} else {
			return undefined;
		}
	} else {
		return wire.ingestedAt;
	}
}

export function getTimeStamps(wires: WireData[], sortBy: SortBy): string[] {
	return wires
		.map((wire) => getTimeStamp(wire, sortBy))
		.filter((ts): ts is string => ts !== undefined);
}

export function getLatestTimeStamp(
	wires: WireData[],
	sortBy: SortBy,
): string | undefined {
	const timestamps = getTimeStamps(wires, sortBy);

	return sortAndGetFirstItem({ timestamps, ascending: false });
}

export function getEarliestTimeStamp(
	wires: WireData[],
	sortBy: SortBy,
): string | undefined {
	const timestamps = getTimeStamps(wires, sortBy);

	return sortAndGetFirstItem({ timestamps, ascending: true });
}

export const forTestingOnly = {
	sortAndGetFirstItem,
};
