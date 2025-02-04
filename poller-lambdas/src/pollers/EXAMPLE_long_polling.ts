import type { LongPollFunction } from '../types';

export const EXAMPLE_long_polling = (async ({
	secret,
	input,
	logger: logger,
}) => {
	const previousCounterValue = parseInt(input);
	logger.log({
		message: 'commence long poll (hard coded example to return after 5s)...',
		secretLength: secret.length,
		input,
		previousCounterValue,
	});
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
					imageIds: [],
				},
			},
			{
				externalId: 'bar',
				body: {
					body_text: 'bar',
					keywords: [],
					imageIds: [],
				},
			},
		],
		valueForNextPoll: newCounterValue.toString(),
	};
}) satisfies LongPollFunction;
