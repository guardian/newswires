import type { Message } from '@aws-sdk/client-sqs';
import { ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { getFromEnv } from 'newswires-shared/config';
import { sqs } from 'newswires-shared/sqs';
import { main } from './src/handler';

const SQS_QUEUE_URL = getFromEnv('INGESTION_LAMBDA_QUEUE_URL');

const receiveMessage = (queueUrl: string) =>
	sqs.send(
		new ReceiveMessageCommand({
			AttributeNames: ['All'],
			MaxNumberOfMessages: 10,
			MessageAttributeNames: ['All'],
			QueueUrl: queueUrl,
			WaitTimeSeconds: 20,
			VisibilityTimeout: 20,
		}),
	);

run();

async function run() {
	const { Messages } = await receiveMessage(SQS_QUEUE_URL);

	if (!Messages) {
		console.log(
			'No messages received from SQS queue. You can run the `fingerpost-queuing-lambda` app to populate this',
		);
		return;
	}
	const Records = Messages.map((message) => {
		return createSQSRecord(message);
	});
	const event: SQSEvent = { Records };
	main(event).then(console.log).catch(console.error);
}

function createSQSRecord(message: Message): SQSRecord {
	const randomSqsMessageId = Math.random().toString(36).substring(7);

	const recordThatShouldSucceed: SQSRecord = {
		messageId: message.MessageId || randomSqsMessageId,
		body: message.Body || {},

		messageAttributes: message.MessageAttributes || {},
	} as unknown as SQSRecord;
	return recordThatShouldSucceed;
}

