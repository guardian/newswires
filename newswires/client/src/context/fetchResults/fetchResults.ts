import { pandaFetch } from '../../panda-session.ts';
import type { Config, Query, WiresQueryData } from '../../sharedTypes.ts';
import { WiresQueryResponseSchema } from '../../sharedTypes.ts';
import { paramsToQuerystring } from '../../urlState.ts';
import { transformWireItemQueryResult } from '../transformQueryResponse.ts';
import { extractServerTiming } from './extractServerTiming.ts';
import { generateRequestId } from './generateRequestId.ts';

export const fetchResults = async ({
	query,
	view,
	afterTimeStamp,
	beforeTimeStamp,
	abortController,
}: {
	query: Query;
	view: Config['view'];
	afterTimeStamp?: string;
	beforeTimeStamp?: string;
	abortController?: AbortController;
}): Promise<{
	data: WiresQueryData;
	requestId: string;
	serverTiming?: number;
}> => {
	const endpoint = view.includes('dotcopy') ? '/api/dotcopy' : '/api/search';
	const requestIdToUse = generateRequestId();
	const queryString = paramsToQuerystring({
		query,
		useAbsoluteDateTimeValues: true,
		beforeTimeStamp,
		afterTimeStamp,
	});
	const response = await pandaFetch(`${endpoint}${queryString}`, {
		headers: {
			Accept: 'application/json',
			'x-newswires-request-id': requestIdToUse,
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

	const serverTiming = extractServerTiming(response.headers);

	return {
		data: {
			...parseResult.data,
			results: parseResult.data.results.map(transformWireItemQueryResult),
		},
		requestId: requestIdToUse,
		serverTiming,
	};
};
