import type {
	FixedFrequencyPollFunction,
	PollerInput,
	SecretValue,
} from '../types';

export const EXAMPLE_fixed_frequency = (async (
	secret: SecretValue,
	input: PollerInput,
) => {
	const previousCounterValue = parseInt(input);
	await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate polling work taking a short time
	const newCounterValue = previousCounterValue + 1;
	console.log({
		secretLength: secret.length,
		input,
		previousCounterValue,
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
		],
		idealFrequencyInSeconds: 30,
		valueForNextPoll: newCounterValue.toString(),
	};
}) satisfies FixedFrequencyPollFunction;
