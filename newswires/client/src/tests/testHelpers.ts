import { act } from '@testing-library/react';
import moment from 'moment';

/**
 * Flushes pending promises by resolving the current microtask queue.
 * Useful in unit tests to ensure all async operations and state updates have completed.
 */
export const flushPendingPromises = async () =>
	act(async () => {
		await Promise.resolve();
	});

/**
 * For use where we are intentionally passing an invalid value to moment,
 * so deprecation warnings are expected and not helpful */
export function withSuppressMomentDeprecationWarnings<T>(fn: () => T): T {
	const originalSuppressDeprecationWarnings =
		moment.suppressDeprecationWarnings;
	moment.suppressDeprecationWarnings = true;
	try {
		return fn();
	} finally {
		moment.suppressDeprecationWarnings = originalSuppressDeprecationWarnings;
	}
}
