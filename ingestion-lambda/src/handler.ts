import type {
	SESEvent,
	SESEventRecord,
	SQSBatchResponse,
	SQSEvent,
	SQSRecord,
} from 'aws-lambda';
import { findVerificationFailures } from '../../shared/findVerificationFailures';
import { createLogger } from '../../shared/lambda-logging';
import { initialiseDbConnection } from '../../shared/rds';
import { EMAIL_BUCKET_NAME, FEEDS_BUCKET_NAME } from '../../shared/s3';
import type { BatchItemFailure, OperationResult } from '../../shared/types';
import { putItemToDb } from './db';
import { getItemFromS3 } from './getItemFromS3';
import { processFingerpostJsonContent } from './processContentObject';
import { processEmailContent } from './processEmailContent';

function processSESRecord(record: SESEventRecord): OperationResult<{
	externalId: string;
	objectKey: string;
}> {
	const { ses } = record;

	const { hasFailures, failedChecks } = findVerificationFailures(ses.receipt);

	if (hasFailures) {
		return {
			status: 'failure',
			reason: `Email verification failed: ${failedChecks
				.map((check) => `${check.name}=${check.status}`)
				.join(', ')}`,
		};
	}

	const messageId = ses.mail.messageId;
	const externalId = `EMAIL-${messageId}`;
	const objectKey = messageId;
	return {
		status: 'success',
		externalId,
		objectKey,
	};
}

function processSQSRecord(
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

function processRecord(
	record: SESEventRecord | SQSRecord,
): OperationResult<{ externalId: string; objectKey: string }> {
	if (isSESRecord(record)) {
		return processSESRecord(record);
	} else {
		return processSQSRecord(record);
	}
}

function isSESRecord(
	record: SESEventRecord | SQSRecord,
): record is SESEventRecord {
	return 'ses' in record;
}

export const main = async (
	event: SQSEvent | SESEvent,
): Promise<SQSBatchResponse | void> => {
	const logger = createLogger({});

	const records = event.Records;
	const { sql, closeDbConnection } = await initialiseDbConnection();
	try {
		const results: Array<OperationResult<{ didCreateNewItem: boolean }>> =
			await Promise.all(
				records.map(async (record) => {
					const isSES = isSESRecord(record);
					const failureWith = (reason: string): BatchItemFailure => ({
						status: 'failure',
						messageId: isSES ? record.ses.mail.messageId : record.messageId,
						recordType: isSES ? 'SES' : 'SQS',
						reason,
					});
					const processedMessage = processRecord(record);
					if (processedMessage.status === 'failure') {
						return failureWith(processedMessage.reason);
					}

					const s3Result = await getItemFromS3({
						objectKey: processedMessage.objectKey,
						bucketName: isSES ? EMAIL_BUCKET_NAME : FEEDS_BUCKET_NAME,
					});
					if (s3Result.status === 'failure') {
						return failureWith(s3Result.reason);
					}

					const contentResults = isSES
						? await processEmailContent(s3Result.body)
						: processFingerpostJsonContent(s3Result.body);
					if (contentResults.status === 'failure') {
						return failureWith(contentResults.reason);
					}

					const dbResult = await putItemToDb({
						processedObject: contentResults,
						externalId: processedMessage.externalId,
						s3Key: processedMessage.objectKey,
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

		const batchItemFailures = allFailures.map(({ messageId, reason }) => {
			logger.error({
				message: `Failed to process message for ${messageId}: ${reason}`,
				eventType: 'INGESTION_FAILURE',
				messageId,
				reason,
			});
			return { itemIdentifier: messageId };
		});

		console.log(
			`Processed ${records.length} messages with ${batchItemFailures.length} failures`,
		);

		return { batchItemFailures };
	} finally {
		await closeDbConnection();
	}
};
