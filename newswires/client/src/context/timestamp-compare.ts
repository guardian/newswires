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

export function sortAndGetFirstItem(
	timestamps: string[],
	ascending: boolean,
): string | undefined {
	if (timestamps.length === 0) {
		return undefined;
	}
	const sorted = timestamps.toSorted(sortByTimeStamp({ ascending }));
	return sorted[0];
}

function getTimeStamps(wires: WireData[], sortBy: SortBy): string[] {
	if (isSortByAddedToCollectionAt(sortBy)) {
		return wires
			.map(
				(wire) =>
					wire.collections.find((c) => c.collectionId === sortBy.collectionId)
						?.addedAt,
			)
			.filter((ts): ts is string => ts !== undefined);
	} else {
		return wires.map((wire) => wire.ingestedAt);
	}
}

export function getLatestTimeStamp(
	wires: WireData[],
	sortBy: SortBy,
): string | undefined {
	const timestamps = getTimeStamps(wires, sortBy);

	return sortAndGetFirstItem(timestamps, false);
}

export function getEarliestTimeStamp(
	wires: WireData[],
	sortBy: SortBy,
): string | undefined {
	const timestamps = getTimeStamps(wires, sortBy);

	return sortAndGetFirstItem(timestamps, true);
}
