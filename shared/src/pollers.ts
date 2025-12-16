import { STACK } from './constants';

export const POLLER_LAMBDA_ENV_VAR_KEYS = {
	INGESTION_LAMBDA_QUEUE_URL: 'INGESTION_LAMBDA_QUEUE_URL',
	OWN_QUEUE_URL: 'OWN_QUEUE_URL',
	SECRET_NAME: 'SECRET_NAME',
} as const;

export interface PollerLambdaProps {
	overrideLambdaMemoryMB?: number;
	overrideLambdaTimeoutSeconds?: number;
}

export const pollerIdToLambdaAppName = (pollerId: PollerId) =>
	`${pollerId}_poller_lambda`;

export const getPollerSecretName = (stage: string, pollerId: PollerId) =>
	`/${stage}/${STACK}/newswires/${pollerIdToLambdaAppName(pollerId)}`;

export type PollerConfig = PollerLambdaProps & {
	idealFrequencyInSeconds?: number;
};

export type PollerId = keyof typeof POLLERS_CONFIG;

export const REUTERS_POLLING_FREQUENCY_IN_SECONDS = 60;

export const POLLERS_CONFIG = {
	// EXAMPLE_long_polling: {},
	// EXAMPLE_fixed_frequency: { idealFrequencyInSeconds: 30 },
	reuters: { idealFrequencyInSeconds: REUTERS_POLLING_FREQUENCY_IN_SECONDS },
	apPoller: {},
} as const satisfies Record<string, PollerConfig>; // used to generate lambda etc. per agency, with config mapped
