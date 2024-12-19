import type {
	FixedFrequencyPollFunction,
	PollerInput,
	SecretValue,
} from '../../types';

export const reutersPoller = (async (
	_secret: SecretValue,
	_input: PollerInput,
) => {
	console.log('Reuters poller running');
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return {
		payloadForIngestionLambda: [],
		valueForNextPoll: '',
		idealFrequencyInSeconds: 30,
	};
}) satisfies FixedFrequencyPollFunction;
