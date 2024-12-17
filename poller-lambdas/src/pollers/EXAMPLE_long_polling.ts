import type { LongPollFunction, PollerInput, SecretValue } from '../types';

export const EXAMPLE_long_polling = (async (
	secret: SecretValue,
	input: PollerInput,
) => {
	const previousCounterValue = parseInt(input);
	console.log({
		secretLength: secret.length,
		input,
		previousCounterValue,
	});
	console.log('commence long poll (hard coded example to return after 5s)...');
	await new Promise((resolve) => setTimeout(resolve, 5_000)); // simulate long poll taking 5s
	const newCounterValue = previousCounterValue + 1;
	console.log({
		newCounterValue,
	});
	return {
		payloadForIngestionLambda: [
			{
				externalId: 'foo',
				body: {
					body_text: 'foo',
					keywords: [],
				},
			},
			{
				externalId: 'bar',
				body: {
					body_text: 'bar',
					keywords: [],
				},
			},
		],
		valueForNextPoll: newCounterValue.toString(),
	};
}) satisfies LongPollFunction;
