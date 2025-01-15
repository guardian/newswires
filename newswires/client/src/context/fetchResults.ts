import { pandaFetch } from '../panda-session.ts';
import type { Query, WiresQueryResponse } from '../sharedTypes.ts';
import { WiresQueryResponseSchema } from '../sharedTypes.ts';
import { paramsToQuerystring } from '../urlState.ts';

export const fetchResults = async (
	query: Query,
	sinceId: string | undefined = undefined,
): Promise<WiresQueryResponse> => {
	const queryToSerialise = sinceId
		? { ...query, sinceId: sinceId.toString() }
		: query;
	const queryString = paramsToQuerystring(queryToSerialise);
	const response = await pandaFetch(`/api/search${queryString}`, {
		headers: {
			Accept: 'application/json',
		},
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
		if (parseResult.success) {
			return parseResult.data;
		}
		throw new Error(
			`Received invalid data from server: ${JSON.stringify(parseResult.error)}`,
		);
	} catch (e) {
		throw new Error(e instanceof Error ? e.message : 'Unknown error');
	}
};
