import {
	SendMessageCommand,
	type SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { getFromEnv } from './config';
import { getErrorMessage } from './getErrorMessage';
import { putToS3 } from './s3';
import { sqs } from './sqs';

export async function putToS3AndQueueIngestion({
	externalId,
	keyPrefix,
	body,
}: {
	externalId: string;
	keyPrefix: string;
	body: string;
}): Promise<{ status: 'success' } | { status: 'failure'; reason: string }> {
	const objectKey = `${keyPrefix}/${externalId}.json`;

	try {
		const s3PutResult = await putToS3({
			bucketName: getFromEnv('FEEDS_BUCKET_NAME'),
			key: objectKey,
			body,
		});
		if (s3PutResult.status === 'failure') {
			throw new Error(
				`Failed to put object to S3 with key "${objectKey}" in bucket "${getFromEnv(
					'FEEDS_BUCKET_NAME',
				)}"`,
			);
		}
		const message: SendMessageCommandInput = {
			QueueUrl: getFromEnv('INGESTION_LAMBDA_QUEUE_URL'),
			MessageBody: JSON.stringify({
				externalId,
				objectKey,
			}),
			MessageAttributes: {
				'Message-Id': {
					StringValue: externalId,
					DataType: 'String',
				},
			},
		};
		await sqs.send(new SendMessageCommand(message)).catch((error) => {
			throw new Error(
				`Failed to send message to ingestion queue for externalId "${externalId}": ${getErrorMessage(error)}`,
				{ cause: error },
			);
		});

		return { status: 'success' };
	} catch (error) {
		return {
			status: 'failure',
			reason: `Error when trying to put to S3 and queue the ingestion Lambda: ${getErrorMessage(error)}.`,
		};
	}
}
