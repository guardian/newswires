import type { SESEvent, SQSBatchResponse, SQSEvent } from 'aws-lambda';
import {
	FAILED_INGESTION_EVENT_TYPE,
	INGESTION_PROCESSING_SQS_MESSAGE_EVENT_TYPE,
	SUCCESSFUL_INGESTION_EVENT_TYPE,
} from '../../shared/constants';
import { getErrorMessage } from '../../shared/getErrorMessage';
import { createLogger } from '../../shared/lambda-logging';
import { initialiseDbConnection } from '../../shared/rds';
import { BUCKET_NAME, putToS3 } from '../../shared/s3';
import type { BatchItemFailure, BatchItemResult } from '../../shared/types';
import { tableName } from './database';
import { processContent } from './processContentObject';

// Retrieve a value from a JSON-like string regardless of its validity.
export const extractFieldFromString = (
	input: string,
	targetField: string,
): string | undefined => {
	const regex = new RegExp(`"${targetField}"\\s*:\\s*"([^"]*)"`); // Capture a value from a "key": "value" pattern.
	const match = input.match(regex);
	return match ? match[1] : undefined;
};

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
		console.log(`Processing ${records.length} messages`);

		const results = await Promise.all(
			records.map(
				async ({
					messageId: sqsMessageId,
					messageAttributes,
					body,
				}): Promise<BatchItemResult> => {
					logger.log({
						message: `Processing message for ${sqsMessageId}`,
						eventType: INGESTION_PROCESSING_SQS_MESSAGE_EVENT_TYPE,
						sqsMessageId,
					});
					try {
						const externalId = messageAttributes['Message-Id']?.stringValue;

						if (!externalId) {
							await putToS3({
								bucketName: BUCKET_NAME,
								key: `GuMissingExternalId/${sqsMessageId}.json`,
								body: JSON.stringify({
									externalId,
									messageAttributes,
									body,
								}),
							});
							throw new Error(
								`Message (sqsMessageId: ${sqsMessageId}) is missing fingerpost Message-Id attribute`,
							);
						}

						// todo -- consider storing s3 object version in db
						await putToS3({
							bucketName: BUCKET_NAME,
							key: `${externalId}.json`,
							body,
						});

						const processedObjectResult = processContent(body);

						if (processedObjectResult.status === 'failure') {
							return {
								status: 'failure',
								reason: processedObjectResult.reason,
								sqsMessageId,
							};
						}

						const { supplier, content, categoryCodes } = processedObjectResult;

						const result = await sql`
                            INSERT INTO ${sql(tableName)}
                                (external_id, supplier, content, category_codes)
                            VALUES (${externalId}, ${supplier}, ${content as never}, ${categoryCodes}) ON CONFLICT (external_id) DO NOTHING
							RETURNING id`;

						if (result.length === 0) {
							logger.warn({
								message: `A record with the provided external_id (messageId: ${externalId}) already exists. No new data was inserted to prevent duplication.`,
								eventType: 'INGESTION_DUPLICATE_STORY',
								externalId,
								sqsMessageId,
							});
						} else {
							logger.log({
								message: `Successfully processed message for ${sqsMessageId} (${content.slug})`,
								eventType: SUCCESSFUL_INGESTION_EVENT_TYPE,
								sqsMessageId,
								externalId,
								supplier,
							});
						}
					} catch (e) {
						const reason = getErrorMessage(e);
						const storyIdentifier =
							extractFieldFromString(body, 'slug') ?? 'unknown slug';
						return {
							status: 'failure',
							reason: `Failed to process message for ${sqsMessageId} (${storyIdentifier}): ${reason}`,
							sqsMessageId,
						};
					}

					return { status: 'success' };
				},
			),
		);

		const batchItemFailures = results
			.filter(
				(result): result is BatchItemFailure => result.status === 'failure',
			)
			.map(({ sqsMessageId, reason }) => {
				console.error({
					sqsMessageId,
					message: reason,
					eventType: FAILED_INGESTION_EVENT_TYPE,
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
