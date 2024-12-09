import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { POLLER_LAMBDA_ENV_VAR_KEYS } from '../../shared/pollers';

/**
 * Is this application running locally, or in AWS?
 * LAMBDA_TASK_ROOT & AWS_EXECUTION_ENV are set when running in AWS
 * See: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
 */
export const isRunningLocally =
	!process.env.LAMBDA_TASK_ROOT && !process.env.AWS_EXECUTION_ENV;

export const remoteAwsConfig = isRunningLocally
	? configureCredentialsForLocalRunning()
	: {};

// Config with credentials for the editorial-feeds account in AWS, if we are running locally.
function configureCredentialsForLocalRunning() {
	const credentials = fromNodeProviderChain({
		profile: 'editorial-feeds',
	});

	return {
		region: 'eu-west-1',
		credentials,
	};
}

// We use localstack to mock some AWS services if we are running locally.
export const localStackAwsConfig = {
	endpoint: 'http://localhost:4566',
	region: 'eu-west-1',
	forcePathStyle: true,
	credentials: {
		accessKeyId: '',
		secretAccessKey: '',
	},
};

export const getEnvironmentVariableOrCrash = (
	key: keyof typeof POLLER_LAMBDA_ENV_VAR_KEYS,
) => process.env[key]!;

// use localstack if we are running locally, otherwise use the remote AWS config
export const ingestionLambdaQueueUrl = isRunningLocally
	? 'http://sqs.eu-west-1.localhost.localstack.cloud:4566/000000000000/ingestion-lambda-queue'
	: getEnvironmentVariableOrCrash(
			POLLER_LAMBDA_ENV_VAR_KEYS.INGESTION_LAMBDA_QUEUE_URL,
		);
