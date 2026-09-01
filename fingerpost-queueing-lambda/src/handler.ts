import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { feedsBucket } from 'newswires-shared/config';
import type { Logger } from 'newswires-shared/lambda-logging';
import { createLogger } from 'newswires-shared/lambda-logging';
import { putToS3AndQueueIngestion } from 'newswires-shared/putToS3AndQueueIngestion';
import { fileService } from 'newswires-shared/s3';
import { validate } from './message-validator';

async function processRecord(
	validationResult:
		| {
				status: 'success';
				externalId: string;
				sqsMessageId: string;
		  }
		| {
				status: 'failure';
				sqsMessageId: string;
				reason: string;
				s3Key: string;
		  },
	body: string,
	logger: Logger,
) {
	if (validationResult.status === 'success') {
		logger.log({
			message: `Processing message with sqsMessageId ${validationResult.sqsMessageId} and externalId ${validationResult.externalId}`,
			eventType: 'FINGERPOST_QUEUEING_LAMBDA_PROCESSING',
			sqsMessageId: validationResult.sqsMessageId,
			externalId: validationResult.externalId,
		});
		return await putToS3AndQueueIngestion({
			externalId: validationResult.externalId,
			keyPrefix: 'fingerpost-queueing-lambda',
			body,
		});
	} else {
		logger.error({
			message: validationResult.reason,
			eventType: 'FINGERPOST_QUEUEING_LAMBDA_PROCESSING_ERROR',
			sqsMessageId: validationResult.sqsMessageId,
			s3Key: validationResult.s3Key,
		});
		return await fileService.putObject({
			bucketName: feedsBucket(),
			key: validationResult.s3Key,
			body,
		});
	}
}

export const main = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const results = await Promise.all(
		event.Records.map(
			async ({ messageId: sqsMessageId, messageAttributes, body }) => {
				const logger = createLogger({ sqsMessageId });
				logger.log({ message: 'Processing SQS message' });
				const validationResult = validate(sqsMessageId, messageAttributes);
				const response = await processRecord(validationResult, body, logger);
				if (response.status === 'success') {
					return undefined; // We only return batchItemFailures for failed messages
				}
				logger.error({
					message: `Failed to process message with sqsMessageId ${sqsMessageId}.`,
					eventType: 'FINGERPOST_QUEUEING_LAMBDA_PROCESSING_ERROR',
					sqsMessageId,
					s3Key: response.s3Key,
					reason: response.reason,
				});
				return { itemIdentifier: sqsMessageId };
			},
		),
	);
	const batchItemFailures = results.filter((result) => result !== undefined);
	return { batchItemFailures };
};
