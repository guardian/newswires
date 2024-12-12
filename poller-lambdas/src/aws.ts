import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { POLLER_LAMBDA_ENV_VAR_KEYS } from '../../shared/pollers';
import {
	getEnvironmentVariableOrCrash,
	isRunningLocally,
	remoteAwsConfig,
} from './config';

const buildLocalFakeSqsClient = () => {
	const queueData: Record<string, SendMessageCommand[]> = {};
	return {
		queueData: queueData,
		send: (command: SendMessageCommand) => {
			const currentQueue: SendMessageCommand[] =
				queueData[command.input.QueueUrl!] ?? [];
			queueData[command.input.QueueUrl!] = [...currentQueue, command];
			return Promise.resolve();
		},
	};
};

export const sqs = isRunningLocally
	? buildLocalFakeSqsClient()
	: new SQSClient(remoteAwsConfig);

export const secretsManager = new SecretsManagerClient(remoteAwsConfig);

const lambdaApp = process.env['App'];

export const queueNextInvocation = (props: {
	MessageBody: string;
	DelaySeconds?: number;
}) =>
	sqs.send(
		new SendMessageCommand({
			QueueUrl: getEnvironmentVariableOrCrash(
				POLLER_LAMBDA_ENV_VAR_KEYS.OWN_QUEUE_URL,
			),
			MessageDeduplicationId: lambdaApp, // should prevent the same lambda from being invoked multiple times
			...props,
		}),
	);
