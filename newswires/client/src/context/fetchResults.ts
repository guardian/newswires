import { pandaFetch } from '../panda-session.ts';
import type { Query, WiresQueryData } from '../sharedTypes.ts';
import { WiresQueryResponseSchema } from '../sharedTypes.ts';
import { paramsToQuerystring } from '../urlState.ts';
import { transformWireItemQueryResult } from './transformQueryResponse.ts';

export const fetchResults = async ({
	query,
	dotcopy,
	sinceId,
	beforeId,
	abortController,
}: {
	query: Query;
	dotcopy: boolean;
	sinceId?: string;
	beforeId?: string;
	abortController?: AbortController;
}): Promise<WiresQueryData> => {
	const endpoint = dotcopy ? '/api/dotcopy' : '/api/search';
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
