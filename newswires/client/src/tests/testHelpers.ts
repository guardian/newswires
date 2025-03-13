import { act } from '@testing-library/react';

/**
 * Flushes pending promises by resolving the current microtask queue.
 * Useful in unit tests to ensure all async operations and state updates have completed.
 */
export const flushPendingPromises = async () =>
	act(async () => {
		await Promise.resolve();
	});

export const disableLogs = () => {
	jest.spyOn(console, 'log').mockImplementation(() => {});
	jest.spyOn(console, 'error').mockImplementation(() => {});
	jest.spyOn(console, 'warn').mockImplementation(() => {});
	jest.spyOn(console, 'info').mockImplementation(() => {});
	jest.spyOn(console, 'debug').mockImplementation(() => {});
};
