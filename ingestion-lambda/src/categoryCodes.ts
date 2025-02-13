function partition<T>(
	inputArray: T[],
	predicate: (item: T) => boolean,
): [T[], T[]] {
	const first = [];
	const second = [];
	for (const item of inputArray) {
		if (predicate(item)) {
			first.push(item);
		} else {
			second.push(item);
		}
	}
	return [first, second];
}

function flattenCategoryCodes(categoryCodes: string): string[] {
	const [prefix, ...codes] = categoryCodes.split(':');
	return codes
		.flatMap((_) => _.split('+'))
		.flatMap((code) => `${prefix}:${code}`);
}

export function processFingerpostAPCategoryCodes(original: string[]): string[] {
	const remainingNotServiceCodes = original.filter((_) => !_.includes('service:'));
	const [iptccatCodes, rest] = partition(remainingNotServiceCodes, (code) =>
		code.includes('iptccat:'),
	);
	const transformedIptccatCodes = iptccatCodes.flatMap(flattenCategoryCodes);

	const allCategoryCodes = [...transformedIptccatCodes, ...rest]
		.map((_) => _.trim())
		.filter((_) => _.length > 0);
	const deduped = [...new Set(allCategoryCodes)];
	return deduped;
}
