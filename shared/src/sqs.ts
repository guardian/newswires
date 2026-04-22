import type {
	SendMessageCommandInput,
	SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import {
	config,
	getOptionalFromEnv,
	isRunningLocally,
	remoteAwsConfig,
} from './config';

const SQS_QUEUE_URL = getOptionalFromEnv('INGESTION_LAMBDA_QUEUE_URL') ?? '';

const { isLocal, awsConfig, queueUrl } = config;

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

interface QueueService {
	send(
		message: SendMessageCommandInput,
	): Promise<SendMessageCommandOutput | void>;
	queueUrl: string;
}

export class InMemoryQueueService implements QueueService {
	queueUrl: string;
	queueData: Record<string, SendMessageCommand[]>;
	constructor() {
		this.queueUrl = '';
		this.queueData = {};
	}
	send(message: SendMessageCommandInput): Promise<void> {
		const command = new SendMessageCommand(message);
		const currentQueue: SendMessageCommand[] =
			this.queueData[command.input.QueueUrl!] ?? [];
		this.queueData[command.input.QueueUrl!] = [...currentQueue, command];
		return Promise.resolve();
	}
}

class SqsQueueService implements QueueService {
	queueUrl: string;
	constructor(public sqsClient: SQSClient) {
		this.queueUrl = queueUrl ?? '';
	}
	send(message: SendMessageCommandInput): Promise<SendMessageCommandOutput> {
		return this.sqsClient.send(new SendMessageCommand(message));
	}
}

export const queueService = isLocal
	? new InMemoryQueueService()
	: new SqsQueueService(new SQSClient(awsConfig));
