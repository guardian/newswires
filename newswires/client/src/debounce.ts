// eslint-disable-next-line @typescript-eslint/no-explicit-any -- suitably generic function
export const debounce = <F extends (...args: any[]) => void>(
	f: F,
	delay: number,
): ((...args: Parameters<F>) => void) => {
	let waiting: ReturnType<typeof setTimeout> | undefined;

	return (...args: Parameters<F>) => {
		if (waiting !== undefined) {
			clearTimeout(waiting);
		}
		waiting = setTimeout(() => f(...args), delay);
	};
};
