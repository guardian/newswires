export const POLLER_LAMBDA_ENV_VAR_KEYS = {
	INGESTION_LAMBDA_QUEUE_URL: 'INGESTION_LAMBDA_QUEUE_URL',
	OWN_QUEUE_URL: 'OWN_QUEUE_URL',
	SECRET_NAME: 'SECRET_NAME',
} as const;

export interface PollerLambdaProps {
	overrideLambdaMemoryMB?: number;
	overrideLambdaTimeoutSeconds?: number;
}

export type PollerConfig = PollerLambdaProps & {
	idealFrequencyInSeconds?: number; //TODO some how guarantee that if this is not provided then the function must return something for the next invocation
};

export type PollerId = keyof typeof POLLERS_CONFIG;

export const POLLERS_CONFIG = {
	EXAMPLE_long_polling: {},
	EXAMPLE_fixed_frequency: { idealFrequencyInSeconds: 30 },
} as const satisfies Record<string, PollerConfig>; // used to generate lambda etc. per agency, with config mapped
