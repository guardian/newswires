import type { SQSMessageAttributes } from 'aws-lambda';

export function validate(
	sqsMessageId: string,
	messageAttributes: SQSMessageAttributes,
):
	| { status: 'success'; externalId: string; sqsMessageId: string }
	| { status: 'failure'; reason: string; s3Key: string; sqsMessageId: string } {
	const externalId = messageAttributes['Message-Id']?.stringValue;

	const hasExternalId = externalId && externalId.trim().length > 0;

	if (!hasExternalId) {
		return {
			status: 'failure',
			reason: `Message with sqsMessageId ${sqsMessageId} has no externalId. `,
			s3Key: `GuMissingExternalId/${sqsMessageId}.json`,
			sqsMessageId,
		};
	}

	const splitTotalString =
		messageAttributes['Message-Split-Total']?.stringValue;
	const splitTotal = splitTotalString ? Number(splitTotalString) : undefined;

	if (splitTotal && splitTotal > 1) {
		return {
			status: 'failure',
			reason: `Message with sqsMessageId ${sqsMessageId} is split over several SNS messages`,
			s3Key: `GuFileTooLarge/${externalId}.json`,
			sqsMessageId,
		};
	}
	return {
		status: 'success',
		externalId: externalId,
		sqsMessageId,
	};
}
