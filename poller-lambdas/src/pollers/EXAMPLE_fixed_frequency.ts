import type { FixedFrequencyPollFunction, SecretValue } from '../types';

export const EXAMPLE_fixed_frequency = (async (secret: SecretValue) => {
	console.log({
		secretLength: secret.length,
		pollingAt: new Date().toISOString(),
	});
	await new Promise((resolve) => setTimeout(resolve, 10));
	return {
		payloadForIngestionLambda: [],
		idealFrequencyInSeconds: 30,
	};
}) satisfies FixedFrequencyPollFunction;
