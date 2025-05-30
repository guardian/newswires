import { pandaFetch } from '../panda-session.ts';
import type { Query, WiresQueryData } from '../sharedTypes.ts';
import { WiresQueryResponseSchema } from '../sharedTypes.ts';
import { paramsToQuerystring } from '../urlState.ts';
import { transformWireItemQueryResult } from './transformQueryResponse.ts';

export const fetchResults = async (
	query: Query,
	additionalParams: {
		sinceId?: string;
		beforeId?: string;
	} = {},
	abortController?: AbortController,
): Promise<WiresQueryData> => {
	const queryString = paramsToQuerystring(query, true, additionalParams);
	const response = await pandaFetch(`/api/search${queryString}`, {
		headers: {
			Accept: 'application/json',
		},
		signal: abortController?.signal ?? undefined,
	});
	try {
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
	} catch (e) {
		throw new Error(e instanceof Error ? e.message : 'Unknown error');
	}
};
