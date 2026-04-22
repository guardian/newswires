import { type SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { getErrorMessage } from '@guardian/libs';
import { getFromEnv, config } from './config';
import { fileService } from './s3';
import { queueService } from './sqs';

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
	const feedsBucket = config.feedsBucket ?? ''
	try {
		const s3PutResult = await fileService.putToS3(feedsBucket, objectKey, body);
		if (s3PutResult.status === 'failure') {
			throw new Error(
				`Failed to put object to S3 with key "${objectKey}" in bucket "${feedsBucket}"`,
			);
		}
		const message: SendMessageCommandInput = {
			QueueUrl: queueService.queueUrl,
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
		await queueService.send(message).catch((error) => {
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
