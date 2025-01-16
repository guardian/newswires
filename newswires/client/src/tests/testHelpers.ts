import { act } from '@testing-library/react';

/**
 * Flushes pending promises by resolving the current microtask queue.
 * Useful in unit tests to ensure all async operations and state updates have completed.
 */
export const flushPendingPromises = async () =>
	act(async () => {
		await Promise.resolve();
	});
