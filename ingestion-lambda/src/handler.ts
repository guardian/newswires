import type {
	SESEvent,
	SQSBatchResponse,
	SQSEvent,
	SQSRecord,
} from 'aws-lambda';
import { createLogger } from '../../shared/lambda-logging';
import { initialiseDbConnection } from '../../shared/rds';
import type { BatchItemFailure, OperationResult } from '../../shared/types';
import { classification } from './classification';
import { putItemToDb } from './db';
import { getItemFromS3 } from './getItemFromS3';
import { processContent } from './processContentObject';

function processMessage(
	record: SQSRecord,
): OperationResult<{ externalId: string; objectKey: string }> {
	const { externalId, objectKey } = JSON.parse(record.body) as unknown as {
		externalId: string;
		objectKey: string;
	};
	if (!objectKey || !externalId) {
		return {
			status: 'failure',
			reason: `Message is missing required attributes: externalId or objectKey`,
		};
	}
	return {
		status: 'success',
		externalId,
		objectKey,
	};
}

function isSESEvent(event: SQSEvent | SESEvent): event is SESEvent {
	return event.Records.some((record) => 'ses' in record);
}

export const main = async (
	event: SQSEvent | SESEvent,
): Promise<SQSBatchResponse | void> => {
	const logger = createLogger({});

	if (isSESEvent(event)) {
		logger.log({ message: 'received SES event', event });
		return;
	}

	const records = event.Records;
	const { sql, closeDbConnection } = await initialiseDbConnection();
	try {
		const results: Array<OperationResult<{ didCreateNewItem: boolean }>> =
			await Promise.all(
				records.map(async (record) => {
					const failureWith = (reason: string): BatchItemFailure => ({
						status: 'failure',
						sqsMessageId: record.messageId,
						reason,
					});
					const processedMessage = processMessage(record);
					if (processedMessage.status === 'failure') {
						return failureWith(processedMessage.reason);
					}
					const s3Result = await getItemFromS3({
						objectKey: processedMessage.objectKey,
					});
					if (s3Result.status === 'failure') {
						return failureWith(s3Result.reason);
					}
					const contentResults = processContent(s3Result.body);
					if (contentResults.status === 'failure') {
						return failureWith(contentResults.reason);
					}
					const classifications = classification(contentResults);
					const dbResult = await putItemToDb({
						processedObject: contentResults,
						externalId: processedMessage.externalId,
						s3Key: processedMessage.objectKey,
						classifications: classifications,
						sql,
						logger,
					});
					if (dbResult.status === 'failure') {
						return failureWith(dbResult.reason);
					}
					return dbResult;
				}),
			);

		const allFailures = results.filter(
			(result): result is BatchItemFailure => result.status === 'failure',
		);

		console.log(
			`Processed ${records.length} messages with ${allFailures.length} failures`,
		);

		const batchItemFailures = allFailures.map(({ sqsMessageId, reason }) => {
			logger.error({
				message: `Failed to process message for ${sqsMessageId}: ${reason}`,
				eventType: 'INGESTION_FAILURE',
				sqsMessageId,
				reason,
			});
			return { itemIdentifier: sqsMessageId };
		});

		console.log(
			`Processed ${records.length} messages with ${batchItemFailures.length} failures`,
		);

		return { batchItemFailures };
	} finally {
		await closeDbConnection();
	}
};
