import type { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import { isRunningLocally, remoteAwsConfig } from './config';

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
