import { pandaFetch } from '../panda-session.ts';
import type {
	Config,
	Query,
	ToolLink,
	WiresQueryData,
	WireToolLinks,
} from '../sharedTypes.ts';
import { ToolLinksResponseSchema } from '../sharedTypes.ts';
import { WiresToolLinksResponseSchema } from '../sharedTypes.ts';
import { WiresQueryResponseSchema } from '../sharedTypes.ts';
import { paramsToQuerystring } from '../urlState.ts';
import { transformWireItemQueryResult } from './transformQueryResponse.ts';

export const fetchResults = async ({
	query,
	view,
	sinceId,
	beforeId,
	abortController,
}: {
	query: Query;
	view: Config['view'];
	sinceId?: string;
	beforeId?: string;
	abortController?: AbortController;
}): Promise<WiresQueryData> => {
	const endpoint = view.includes('dotcopy') ? '/api/dotcopy' : '/api/search';
	const queryString = paramsToQuerystring({
		query,
		useAbsoluteDateTimeValues: true,
		beforeId,
		sinceId,
	});
	const response = await pandaFetch(`${endpoint}${queryString}`, {
		headers: {
			Accept: 'application/json',
		},
		signal: abortController?.signal ?? undefined,
	});

	const data = (await response.json()) as unknown;
	if (!response.ok) {
		throw new Error(
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- this is the expected shape from Play but you never know
			(data as { error: { exception: { description: string } } }).error
				.exception.description ?? 'Unknown error',
		);
	}

	const parseResult = WiresQueryResponseSchema.safeParse(data);
	if (!parseResult.success) {
		throw new Error(
			`Received invalid data from server: ${JSON.stringify(parseResult.error)}`,
		);
	}
	return {
		...parseResult.data,
		results: parseResult.data.results.map(transformWireItemQueryResult),
	};
};

export const fetchToolLink = async (wireId: string): Promise<ToolLink[]> => {
	const endpoint = `/api/toollinks/${wireId}`;
	const response = await pandaFetch(`${endpoint}`, {
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
	const parseResult = ToolLinksResponseSchema.safeParse(data);
	if (!parseResult.success) {
		throw new Error(
			`Received invalid data from server: ${JSON.stringify(parseResult.error)}`,
		);
	}
	return parseResult.data;
};
export const fetchToolLinks = async (
	wireIds: string[],
): Promise<WireToolLinks> => {
	if (wireIds.length === 0) return [];
	const endpoint = '/api/toollinks';
	const queryString = new URLSearchParams({
		wireIds: wireIds.join(','),
	}).toString();
	const response = await pandaFetch(`${endpoint}?${queryString}`, {
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

	const parseResult = WiresToolLinksResponseSchema.safeParse(data);
	if (!parseResult.success) {
		throw new Error(
			`Received invalid data from server: ${JSON.stringify(parseResult.error)}`,
		);
	}
	return parseResult.data;
};
