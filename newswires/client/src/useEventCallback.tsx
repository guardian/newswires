import { useCallback, useEffect, useRef } from 'react';

export function useEventCallback<T extends (...args: unknown[]) => unknown>(
	fn: T,
): T {
	const ref = useRef(fn);

	useEffect(() => {
		ref.current = fn;
	});

	return useCallback(
		(...args: unknown[]) => ref.current.apply(void 0, args),
		[],
	) as T;
}
