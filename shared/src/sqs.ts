import type { SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import type { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import { appConfig, ingestionQueueUrl } from './config';

const { appMode, awsConfig } = appConfig;

interface QueueService {
	send(command: SendMessageCommand): Promise<SendMessageCommandOutput | void>;
	queueUrl: string;
}

export class InMemoryQueueService implements QueueService {
	queueUrl: string;
	queueData: Record<string, SendMessageCommand[]>;
	constructor() {
		this.queueUrl = ingestionQueueUrl;
		this.queueData = {};
	}
	send(command: SendMessageCommand): Promise<void> {
		const currentQueue: SendMessageCommand[] =
			this.queueData[command.input.QueueUrl!] ?? [];
		this.queueData[command.input.QueueUrl!] = [...currentQueue, command];
		return Promise.resolve();
	}
}

class SqsQueueService implements QueueService {
	queueUrl: string;
	constructor(public sqsClient: SQSClient) {
		this.queueUrl = ingestionQueueUrl;
	}
	send(command: SendMessageCommand): Promise<SendMessageCommandOutput> {
		return this.sqsClient.send(command);
	}
}

export const queueService =
	appMode === 'dev'
		? new InMemoryQueueService()
		: new SqsQueueService(new SQSClient(awsConfig));
