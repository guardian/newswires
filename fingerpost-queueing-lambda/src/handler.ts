import type { SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { getErrorMessage } from '../../shared/getErrorMessage';
import { createLogger } from '../../shared/lambda-logging';
import { sqs } from '../../shared/sqs';

export const main = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const logger = createLogger({});
	const results = await Promise.all(
		event.Records.map(
			async ({ messageId: sqsMessageId, messageAttributes, body }) => {
				const externalId = messageAttributes['Message-Id']?.stringValue ?? '';
				try {
					const message: SendMessageCommandInput = {
						QueueUrl: getEnvironmentVariableOrCrash(
							'INGESTION_LAMBDA_QUEUE_URL',
						),
						MessageBody: body,
						MessageAttributes: {
							'Message-Id': {
								StringValue: externalId,
								DataType: 'String',
							},
						},
					};
					await sqs.send(new SendMessageCommand(message)).catch((error) => {
						logger.error({
							message: `Sending to queue failed for ${externalId}`,
							error: getErrorMessage(error),
							queueMessage: JSON.stringify(message),
						});
						throw error;
					});
					return undefined;
				} catch (error) {
					logger.error({
						message: `Error processing SQS message (sqsMessageId: ${sqsMessageId}): ${getErrorMessage(error)}. Reporting to SQS as failed.`,
					});
					return { itemIdentifier: sqsMessageId };
				}
			},
		),
	);
	const batchItemFailures = results.filter((result) => result !== undefined);
	return { batchItemFailures };
};

function getEnvironmentVariableOrCrash(key: string) {
	const maybeValue = process.env[key];
	if (maybeValue) {
		return maybeValue;
	}
	throw Error(
		`Environment variable '${key}' was expected to be set, but was in fact ${maybeValue}.`,
	);
}
