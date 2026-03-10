export function partition<T>(
	arr: T[],
	predicate: (item: T) => boolean,
): [T[], T[]] {
	const isTrueOf: T[] = [];
	const isFalseOf: T[] = [];
	arr.forEach((item) => {
		if (predicate(item)) {
			isTrueOf.push(item);
		} else {
			isFalseOf.push(item);
		}
	});
	return [isTrueOf, isFalseOf];
}
