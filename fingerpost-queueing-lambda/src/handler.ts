import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { getFromEnv } from '../../shared/config';
import { createLogger } from '../../shared/lambda-logging';
import { putToS3AndQueueIngestion } from '../../shared/putToS3AndQueueIngestion';
import { putToS3 } from '../../shared/s3';

export const main = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const results = await Promise.all(
		event.Records.map(
			async ({ messageId: sqsMessageId, messageAttributes, body }) => {
				const logger = createLogger({ sqsMessageId });
				logger.log({message: "Processing SQS message"});
				const externalId = messageAttributes['Message-Id']?.stringValue;
				const hasExternalId = externalId && externalId.trim().length > 0;
				const objectKey = hasExternalId
					? `${externalId}.json`
					: `GuMissingExternalId/${sqsMessageId}.json`;

				if (hasExternalId) {
					const putToS3Result = await putToS3AndQueueIngestion({
						externalId,
						keyPrefix: 'fingerpost-queueing-lambda',
						body,
					});
					if (putToS3Result.status === 'success') {
						return undefined; // We only return batchItemFailures for failed messages
					}
					logger.error({
						message: `Failed to put object to S3 and queue ingestion for externalId "${externalId}" with sqsMessageId ${sqsMessageId}.`,
						eventType: 'FINGERPOST_QUEUEING_LAMBDA_S3_AND_QUEUE_FAILURE',
						sqsMessageId,
						externalId,
						reason: putToS3Result.reason,
					});
				} else {
					logger.warn({
						message: `Message with sqsMessageId ${sqsMessageId} has no externalId. Saved to ${objectKey} but not sending to ingestion queue.`,
						eventType: 'FINGERPOST_QUEUEING_LAMBDA_NO_EXTERNAL_ID',
						sqsMessageId,
						objectKey,
					});
					const putToS3Result = await putToS3({
						bucketName: getFromEnv('FEEDS_BUCKET_NAME'),
						key: objectKey,
						body,
					});
					if (putToS3Result.status === 'success') {
						return undefined; // We only return batchItemFailures for failed messages
					}
					logger.error({
						message: `Failed to put object to S3 with key "${objectKey}" in bucket "${getFromEnv(
							'FEEDS_BUCKET_NAME',
						)}" for message with sqsMessageId ${sqsMessageId}.`,
						eventType: 'FINGERPOST_QUEUEING_LAMBDA_S3_FAILURE',
						sqsMessageId,
						objectKey,
						reason: putToS3Result.reason,
					});
				}

				return { itemIdentifier: sqsMessageId };
			},
		),
	);
	const batchItemFailures = results.filter((result) => result !== undefined);
	return { batchItemFailures };
};
