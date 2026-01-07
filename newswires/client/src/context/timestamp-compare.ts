export function sortByTimeStamp(
	{ ascending }: { ascending: boolean } = { ascending: false },
) {
	if (ascending) {
		return (a: string, b: string) => a.localeCompare(b);
	}
	return (a: string, b: string) => b.localeCompare(a);
}

export function getLatestTimeStamp(timestamps: string[]): string | undefined {
	if (timestamps.length === 0) {
		return undefined;
	}
	const sorted = timestamps.toSorted(sortByTimeStamp({ ascending: false }));
	return sorted[0];
}

export function getEarliestTimeStamp(timestamps: string[]): string | undefined {
	if (timestamps.length === 0) {
		return undefined;
	}
	const sorted = timestamps.toSorted(sortByTimeStamp({ ascending: true }));
	return sorted[0];
}
