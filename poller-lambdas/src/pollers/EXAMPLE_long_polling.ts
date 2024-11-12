import type { LongPollFunction, PollerInput, SecretValue } from '../types';

export const EXAMPLE_long_polling = (async (
	secret: SecretValue,
	input: PollerInput,
) => {
	const previousCounterValue = parseInt(input);
	await new Promise((resolve) => setTimeout(resolve, 30000)); // simulate long poll taking 30s
	const newCounterValue = previousCounterValue + 1;
	console.log({
		secretLength: secret.length,
		input,
		previousCounterValue,
		newCounterValue,
	});
	return {
		payloadForIngestionLambda: {},
		valueForNextPoll: newCounterValue.toString(),
	};
}) satisfies LongPollFunction;
