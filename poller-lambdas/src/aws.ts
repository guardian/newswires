import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { POLLER_LAMBDA_ENV_VAR_KEYS } from '../../shared/pollers';
import {
	getEnvironmentVariableOrCrash,
	isRunningLocally,
	localStackAwsConfig,
	remoteAwsConfig,
} from './config';

export const sqs = new SQSClient(
	isRunningLocally ? localStackAwsConfig : remoteAwsConfig,
);
export const secretsManager = new SecretsManagerClient(remoteAwsConfig);

const lambdaApp = process.env['App'];
const ownQueueUrl = isRunningLocally
	? 'http://sqs.eu-west-1.localhost.localstack.cloud:4566/000000000000/ap-poller-queue'
	: getEnvironmentVariableOrCrash(POLLER_LAMBDA_ENV_VAR_KEYS.OWN_QUEUE_URL);

const queueNextInvocationInAws = (props: {
	MessageBody: string | undefined;
	DelaySeconds?: number;
}) =>
	sqs.send(
		new SendMessageCommand({
			QueueUrl: ownQueueUrl,
			MessageDeduplicationId: lambdaApp, // should prevent the same lambda from being invoked multiple times
			...props,
		}),
	);

export const queueNextInvocation = queueNextInvocationInAws;
