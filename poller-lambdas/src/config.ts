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
	? {
			region: 'eu-west-1',
			credentials: fromNodeProviderChain({
				profile: 'editorial-feeds',
			}),
		}
	: {};

export const getEnvironmentVariableOrCrash = (
	key: keyof typeof POLLER_LAMBDA_ENV_VAR_KEYS,
) => process.env[key]!;
