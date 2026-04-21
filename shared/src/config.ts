import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

/**
 * Is this application running locally, or in AWS?
 * LAMBDA_TASK_ROOT & AWS_EXECUTION_ENV are set when running in AWS
 * See: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
 */
export const isRunningLocally =
	!process.env.LAMBDA_TASK_ROOT && !process.env.AWS_EXECUTION_ENV;

type AppMode = 'local' | 'dev' | 'code' | 'prod';
const allowedAppModes: readonly AppMode[] = ['local', 'dev', 'code', 'prod'];
function isAppMode(value: string): value is AppMode {
	return allowedAppModes.includes(value as AppMode);
}
const APP_MODE = (() => {
	const stageEnv = getOptionalFromEnv('STAGE');
	if (!stageEnv) return 'local';
	const stage = stageEnv.toLowerCase();
	if (!isAppMode(stage))
		throw new Error(
			`Invalid stage, ${stage}. Allowed values are ${allowedAppModes.join(', ')}`,
		);
	return stage;
})();

const isLocal = APP_MODE === 'local';
const isDev = APP_MODE === 'dev';

export function getFromEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable ${key}`);
	}
	return value;
}

export function getOptionalFromEnv(key: string): string | undefined {
	return process.env[key];
}

export const remoteAwsConfig = isRunningLocally
	? {
			region: 'eu-west-1',
			credentials: fromNodeProviderChain({
				profile: 'editorial-feeds',
			}),
		}
	: {};

const awsConfig = {
	region: 'eu-west-1',
	credentials: fromNodeProviderChain({
		profile: 'editorial-feeds',
	}),
};

export const config = {
	queueUrl: getOptionalFromEnv('INGESTION_LAMBDA_QUEUE_URL'),
	feedsBucket: getOptionalFromEnv('FEEDS_BUCKET_NAME'),
	appMode: APP_MODE,
	isLocal,
	isDev,
	awsConfig,
};
