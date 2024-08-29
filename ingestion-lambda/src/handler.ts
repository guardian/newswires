import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { BUCKET_NAME } from './config';
import { s3Client } from './s3';

export const main = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const records = event.Records;

	console.log(`Processing ${records.length} messages`);

	const eventBodies = records.map((record: SQSRecord) => ({
		sqsMessageId: record.messageId,
		snsMessageContent: record.body,
		messageAttributes: record.messageAttributes,
	}));

	const responses = await Promise.all(
		eventBodies.map(
			({ sqsMessageId: messageId, messageAttributes, snsMessageContent }) => {
				const fingerpostMessageId =
					messageAttributes['Message-Id']?.stringValue;

				if (!fingerpostMessageId) {
					console.warn(`Message ${messageId} is missing Message-Id attribute`);
					return Promise.resolve({
						status: 'rejected',
						messageId,
					});
				}

				const resp = s3Client.send(
					new PutObjectCommand({
						Bucket: BUCKET_NAME,
						Key: `${fingerpostMessageId}.json`,
						Body: snsMessageContent,
					}),
				);
				return resp
					.then(() => ({ status: 'resolved', messageId }))
					.catch((reason) => {
						console.error(`Failed to put ${messageId} to S3: ${reason}`);
						return { status: 'rejected', messageId };
					});
			},
		),
	);

	const batchItemFailures = responses
		.filter(({ status }) => status === 'rejected')
		.map(({ messageId }) => ({ itemIdentifier: messageId }));

	console.log(
		`Processed ${records.length} messages with ${batchItemFailures.length} failures`,
	);

	return { batchItemFailures };
};

if (require.main === module) {
	const recordThatShouldSucceed: SQSRecord = {
		messageId: 'abc',
		body: JSON.stringify({
			Message: { feedContent: 'hello world' },
		}),
		messageAttributes: {
			'Message-Id': { stringValue: '123', dataType: 'String' },
		},
	} as unknown as SQSRecord;

	const recordThatShouldFail: SQSRecord = {
		messageId: 'def',
		body: JSON.stringify({
			Message: { feedContent: 'hello world, 2!' },
		}),
		messageAttributes: {},
	} as SQSRecord;

	const dummyEvent: SQSEvent = {
		Records: [recordThatShouldSucceed, recordThatShouldFail],
	};

	void (async () => console.log(await main(dummyEvent)))();
}
