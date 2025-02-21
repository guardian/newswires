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

/**
 * We receive AP codes from Fingerpost in the format `prefix:code1+code2+code3:code4+code5`.
 * At the time of writing these are AP category codes, but mislabelled as `iptccat` codes.
 * This function transforms the prefix, and splits the codes into individual category codes.
 */
function flattenCategoryCodes(categoryCodes: string): string[] {
	const [prefix, ...codes] = categoryCodes.split(':');
	return codes
		.flatMap((_) => _.split('+'))
		.map((code) => `${prefix?.trim() === 'iptccat' ? 'apCat' : prefix}:${code}`);
}

export function processFingerpostAPCategoryCodes(original: string[]): string[] {
	const notServiceCodes = original.filter((_) => !_.includes('service:')); // we aren't interested in keeping the service codes here
	const [categoryCodes, rest] = partition(notServiceCodes, (code) =>
		code.includes('iptccat:'),
	);
	const transformedCategoryCodes = categoryCodes.flatMap(flattenCategoryCodes);

	const allCategoryCodes = [...transformedCategoryCodes, ...rest]
		.map((_) => _.trim())
		.filter((_) => _.length > 0);
	const deduped = [...new Set(allCategoryCodes)];
	return deduped;
}

export function processFingerpostAAPCategoryCodes(categoryCodes: string[]): string[] {
	const allCategoryCodes = categoryCodes
		.flatMap((categoryCode) => categoryCode.split('|'))

	const mediaTopics = allCategoryCodes
		.filter((_) => _.split(':').length > 1)

	const legacySubjectCodes = allCategoryCodes
		.filter((_) => _.split('+').length > 1)
		.map((categoryCode) => {
			const [ code, _label ] = categoryCode.split('+');
			return `subj:${code}`
		});

	return [...mediaTopics, ...legacySubjectCodes]
}
