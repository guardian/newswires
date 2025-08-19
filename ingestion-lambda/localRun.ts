import type { SQSEvent, SQSRecord } from 'aws-lambda';
import {
	DeleteMessageBatchCommand,
	Message,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { getFromEnv } from '../shared/config';
import { main } from './src/handler';
import { sqs } from '../shared/sqs';

const SQS_QUEUE_URL = getFromEnv("INGESTION_LAMBDA_QUEUE_URL");

const receiveMessage = (queueUrl: string) =>
  sqs.send(
    new ReceiveMessageCommand({
      AttributeNames: ["All"],
      MaxNumberOfMessages: 10,
      MessageAttributeNames: ["All"],
      QueueUrl: queueUrl,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 20,
    }),
  );

setInterval(run, 1000);

async function run() {
	const { Messages } = await receiveMessage(SQS_QUEUE_URL);

	if (!Messages) {
		console.log('No messages received from SQS queue. You can run the `fingerpost-queuing-lambda` app to populate this');
		return;
	}
	const Records = Messages.map((message) => {
		return createSQSRecord(message)
	})
	const event: SQSEvent = { Records };
	main(event).then(console.log).then(
		() => deleteMessage(Messages).then(() => {
			console.log('Messages deleted successfully');
		})
	).catch(console.error);

}

function deleteMessage(messages: Message[]) {
	const messagesToDelete = messages.map((msg, index) => ({
  		Id: `msg${index}`, // must be unique in the batch
  		ReceiptHandle: msg.ReceiptHandle!,
	}));

	const deleteBatchCommand = new DeleteMessageBatchCommand({
		QueueUrl: SQS_QUEUE_URL,
		Entries: messagesToDelete,
	});
	return sqs.send(deleteBatchCommand)
}


function createSQSRecord(message: Message) : SQSRecord {
	const randomSqsMessageId = Math.random().toString(36).substring(7);

	const recordThatShouldSucceed: SQSRecord = {
		messageId: message.MessageId || randomSqsMessageId,
		body: message.Body || {},

		messageAttributes: message.MessageAttributes || {},
	} as unknown as SQSRecord;
	return recordThatShouldSucceed;

}