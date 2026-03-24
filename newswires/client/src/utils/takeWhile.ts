function* takeWhileGenerator<T>(fn: (x: T) => boolean, xs: Iterable<T>) {
	for (const x of xs) {
		if (fn(x)) {
			yield x;
		} else {
			break;
		}
	}
}
export function takeWhile<T>(fn: (x: T) => boolean, xs: Iterable<T>): T[] {
	return Array.from(takeWhileGenerator(fn, xs));
}
