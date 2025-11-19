import type { ZodSafeParseResult } from 'zod';
import { pandaFetch } from '../panda-session';
import type { ToolLink, WireToolLinks } from '../sharedTypes';
import {
	ToolLinksResponseSchema,
	WiresToolLinksResponseSchema,
} from '../sharedTypes';

export const fetchToolLink = async (wireId: string): Promise<ToolLink[]> => {
	const endpoint = `/api/toollinks/${wireId}`;
	return apiFetch<ToolLink[]>(endpoint, (data) =>
		ToolLinksResponseSchema.safeParse(data),
	);
};
export const fetchToolLinks = async (
	wireIds: string[],
): Promise<WireToolLinks> => {
	if (wireIds.length === 0) return [];
	const endpoint = '/api/toollinks';
	const queryString = new URLSearchParams({
		wireIds: wireIds.join(','),
	}).toString();
	return apiFetch<WireToolLinks>(
		endpoint,
		(data) => WiresToolLinksResponseSchema.safeParse(data),
		queryString,
	);
};

const apiFetch = async <T>(
	endpoint: string,
	parser: (data: unknown) => ZodSafeParseResult<T>,
	queryString?: string,
): Promise<T> => {
	const url = queryString ? `${endpoint}?${queryString}` : `${endpoint}`;
	const response = await pandaFetch(url, {
		headers: {
			Accept: 'application/json',
		},
	});
	const data = (await response.json()) as unknown;
	if (!response.ok) {
		throw new Error(
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- this is the expected shape from Play but you never know
			(data as { error: { exception: { description: string } } }).error
				.exception.description ?? 'Unknown error',
		);
	}
	const parsedResult = parser(data);
	if (!parsedResult.success) {
		throw new Error(
			`Received invalid data from server: ${JSON.stringify(parsedResult.error)}`,
		);
	}
	return parsedResult.data;
};
