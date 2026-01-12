export function sortByTimeStamp(
	{ ascending }: { ascending: boolean } = { ascending: false },
) {
	if (ascending) {
		return (a: string, b: string) => a.localeCompare(b);
	}
	return (a: string, b: string) => b.localeCompare(a);
}

function sortAndGetFirstItem(
	timestamps: string[],
	ascending: boolean,
): string | undefined {
	if (timestamps.length === 0) {
		return undefined;
	}
	const sorted = timestamps.toSorted(sortByTimeStamp({ ascending }));
	return sorted[0];
}

export function getLatestTimeStamp(timestamps: string[]): string | undefined {
	return sortAndGetFirstItem(timestamps, false);
}

export function getEarliestTimeStamp(timestamps: string[]): string | undefined {
	return sortAndGetFirstItem(timestamps, true);
}
