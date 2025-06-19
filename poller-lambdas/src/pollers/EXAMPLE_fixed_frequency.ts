import type { FixedFrequencyPollFunction } from '../types';

export const EXAMPLE_fixed_frequency = (async ({ secret, input, logger }) => {
	const previousCounterValue = parseInt(input);
	await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate polling work taking a short time
	const newCounterValue = previousCounterValue + 1;
	logger.log({
		message: 'commence fixed frequency poll',
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
					'unique-name': 'example',
					body_text: 'foo',
					keywords: [],
					imageIds: [],
				},
			},
		],
		idealFrequencyInSeconds: 30,
		valueForNextPoll: newCounterValue.toString(),
	};
}) satisfies FixedFrequencyPollFunction;
