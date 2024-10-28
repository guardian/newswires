import { FixedFrequencyPollFunction, SecretValue } from '../types';

export default (async (secret: SecretValue) => {
	console.log({
		secretLength: secret.length,
		pollingAt: new Date().toISOString(),
	});
	return {
		payloadForIngestionLambda: {},
		idealFrequencyInSeconds: 30,
	};
}) satisfies FixedFrequencyPollFunction;
