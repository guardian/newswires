import type { z } from 'zod';

export function loadFromLocalStorage<T>(
	key: string,
	schema: z.ZodSchema<T>,
	defaultVal: T,
): T {
	const item = localStorage.getItem(key);
	if (!item) {
		return defaultVal;
	}
	try {
		const parsed = schema.safeParse(JSON.parse(item));
		if (!parsed.success) {
			console.error(parsed.error);
			return defaultVal;
		}
		return parsed.data;
	} catch (e) {
		console.error(e);
		return defaultVal;
	}
}

export function saveToLocalStorage<T>(key: string, data: T) {
	try {
		localStorage.setItem(key, JSON.stringify(data));
	} catch (e) {
		console.error(e);
	}
}
