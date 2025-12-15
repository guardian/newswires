import type { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import {
	getOptionalFromEnv,
	isRunningLocally,
	remoteAwsConfig,
} from './config';

const SQS_QUEUE_URL = getOptionalFromEnv('INGESTION_LAMBDA_QUEUE_URL') || '';
export const sqs = isRunningLocally
	? new SQSClient({ region: 'eu-west-1', endpoint: SQS_QUEUE_URL })
	: new SQSClient(remoteAwsConfig);

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
export const fakeSQS = buildLocalFakeSqsClient();
