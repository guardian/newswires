import type { z } from 'zod/v4';
import { getErrorMessage } from '../../../../shared/getErrorMessage';

function loadFromLocalStorage<T>(
	key: string,
	schema: z.ZodSchema<T>,
): T | null {
	const item = localStorage.getItem(key);
	if (!item) {
		return null;
	}
	try {
		const parsed = schema.safeParse(JSON.parse(item));
		if (!parsed.success) {
			console.error(parsed.error);
			return null;
		}
		return parsed.data;
	} catch (e) {
		console.error(getErrorMessage(e));
		return null;
	}
}

export function saveToLocalStorage<T>(key: string, data: T) {
	try {
		localStorage.setItem(key, JSON.stringify(data));
	} catch (e) {
		console.error(getErrorMessage(e));
	}
}

export function loadOrSetInLocalStorage<T>(
	key: string,
	schema: z.ZodSchema<T>,
	defaultVal: T,
): T {
	const item = loadFromLocalStorage(key, schema);
	if (item === null) {
		saveToLocalStorage(key, defaultVal);
		return defaultVal;
	}
	return item;
}
