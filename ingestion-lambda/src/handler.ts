import type {
	SESEvent,
	SESEventRecord,
	SQSBatchResponse,
	SQSEvent,
	SQSRecord,
} from 'aws-lambda';
import { getFromEnv, isRunningLocally } from 'newswires-shared/config';
import { INGESTION_HEARTBEAT } from 'newswires-shared/constants';
import { findVerificationFailures } from 'newswires-shared/findVerificationFailures';
import type { Logger } from 'newswires-shared/lambda-logging';
import { createLogger } from 'newswires-shared/lambda-logging';
import { initialiseDbConnection } from 'newswires-shared/rds';
import { FEEDS_BUCKET_NAME } from 'newswires-shared/s3';
import type { BatchItemFailure, OperationResult } from 'newswires-shared/types';
import { putItemToDb } from './db';
import { getItemFromS3 } from './getItemFromS3';
import { processFingerpostJsonContent } from './processContentObject';
import { processEmailContent } from './processEmailContent';

async function processSESRecord(
	record: SESEventRecord,
	logger: Logger,
): Promise<
	OperationResult<{
		externalId: string;
		objectKey: string;
	}>
> {
	const { ses } = record;

	const { pass, failedChecks } = await findVerificationFailures(ses);

	if (!pass) {
		const message = `Email verification failed: ${failedChecks
			.map((check) => `${check.name}=${check.status}`)
			.join(', ')}. Sender: ${ses.mail.source}`;
		logger.warn({
			message,
			eventType: 'EMAIL_VERIFICATION_FAILURE',
			emailMessageId: ses.mail.messageId,
			failedChecks,
			sender: ses.mail.source,
		});
		return {
			status: 'failure',
			reason: message,
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

async function processRecord(
	record: SESEventRecord | SQSRecord,
	logger: Logger,
): Promise<OperationResult<{ externalId: string; objectKey: string }>> {
	if (isSESRecord(record)) {
		return await processSESRecord(record, logger);
	} else {
		return processSQSRecord(record);
	}
}

function isSESRecord(
	record: SESEventRecord | SQSRecord,
): record is SESEventRecord {
	return 'ses' in record;
}

const EMAIL_BUCKET_NAME: string = isRunningLocally
	? 'local-email-bucket'
	: getFromEnv('EMAIL_BUCKET_NAME');

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
					const failureWith = (
						reason: string,
						s3Key?: string,
					): BatchItemFailure => ({
						status: 'failure',
						messageId: isSES ? record.ses.mail.messageId : record.messageId,
						recordType: isSES ? 'SES' : 'SQS',
						reason,
						s3Key,
					});
					const processedMessage = await processRecord(record, logger);
					if (processedMessage.status === 'failure') {
						return failureWith(processedMessage.reason);
					}

					const s3Result = await getItemFromS3({
						objectKey: processedMessage.objectKey,
						bucketName: isSES ? EMAIL_BUCKET_NAME : FEEDS_BUCKET_NAME,
					});
					if (s3Result.status === 'failure') {
						return failureWith(s3Result.reason, processedMessage.objectKey);
					}

					const contentResults = isSES
						? await processEmailContent(s3Result.body)
						: processFingerpostJsonContent(s3Result.body);

					if (contentResults.status === 'failure') {
						return failureWith(
							contentResults.reason,
							processedMessage.objectKey,
						);
					}

					if (contentResults.supplier == 'HEARTBEAT') {
						logger.debug({
							message: `Successfully received heartbeat`,
							eventType: INGESTION_HEARTBEAT,
						});
						return {
							status: 'success',
							didCreateNewItem: false,
						};
					}

					const dbResult = await putItemToDb({
						processedObject: contentResults,
						externalId: processedMessage.externalId,
						s3Key: processedMessage.objectKey,
						lastModified: s3Result.lastModified,
						sql,
						logger,
					});
					if (dbResult.status === 'failure') {
						return failureWith(dbResult.reason, processedMessage.objectKey);
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

		allFailures.forEach(({ messageId, reason, s3Key }) => {
			logger.error({
				message: `Failed to process message for ${messageId}: ${reason}`,
				eventType: 'INGESTION_FAILURE',
				messageId,
				reason,
				s3Key,
			});
		});

		const batchItemFailures = allFailures
			.filter(({ reason }) => {
				// no need to retry if the email does not pass its checks
				return !reason.includes(`Email verification failed`);
			})
			.map(({ messageId }) => {
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
