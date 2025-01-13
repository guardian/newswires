import type { LongPollFunction, PollerInput, SecretValue } from '../../types';

export const apPoller = (async (_secret: SecretValue, _input: PollerInput) => {
	console.log('AP poller running');
	await new Promise((resolve) => setTimeout(resolve, 15000));
	return {
		payloadForIngestionLambda: [],
		valueForNextPoll: '',
	};
}) satisfies LongPollFunction;
