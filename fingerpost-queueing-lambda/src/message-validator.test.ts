import type { SQSMessageAttributes } from 'aws-lambda';
import { validate } from './message-validator';

function createMessageAttributes({
	externalId,
	splitTotal,
}: {
	externalId?: string;
	splitTotal?: string;
}): SQSMessageAttributes {
	const attributes: Record<string, { stringValue: string }> = {};

	if (externalId !== undefined) {
		attributes['Message-Id'] = { stringValue: externalId };
	}
	if (splitTotal !== undefined) {
		attributes['Message-Split-Total'] = { stringValue: splitTotal };
	}

	return attributes as unknown as SQSMessageAttributes;
}

describe('validate', () => {
	it('returns success when Message-Id is present and split total is absent', () => {
		const result = validate(
			'sqs-1',
			createMessageAttributes({ externalId: 'external-1' }),
		);

		expect(result).toStrictEqual({
			status: 'success',
			externalId: 'external-1',
			sqsMessageId: 'sqs-1',
		});
	});

	it('returns failure when Message-Id is missing', () => {
		const result = validate('sqs-2', createMessageAttributes({}));

		expect(result).toStrictEqual({
			status: 'failure',
			message: 'Message with sqsMessageId sqs-2 has no externalId. ',
			reason: 'no external id found',
			s3Key: 'GuMissingExternalId/sqs-2.json',
			sqsMessageId: 'sqs-2',
		});
	});

	it('returns failure when Message-Id is blank', () => {
		const result = validate(
			'sqs-3',
			createMessageAttributes({ externalId: '   ' }),
		);

		expect(result).toStrictEqual({
			status: 'failure',
			message: 'Message with sqsMessageId sqs-3 has no externalId. ',
			reason: 'no external id found',
			s3Key: 'GuMissingExternalId/sqs-3.json',
			sqsMessageId: 'sqs-3',
		});
	});

	it('returns failure when Message-Split-Total is greater than 1', () => {
		const result = validate(
			'sqs-4',
			createMessageAttributes({ externalId: 'external-4', splitTotal: '2' }),
		);

		expect(result).toStrictEqual({
			status: 'failure',
			message:
				'Message with sqsMessageId sqs-4 is split over several SNS messages',
			reason: 'file too large',
			s3Key: 'GuFileTooLarge/external-4.json',
			sqsMessageId: 'sqs-4',
		});
	});

	it('returns success when Message-Split-Total is 1', () => {
		const result = validate(
			'sqs-5',
			createMessageAttributes({ externalId: 'external-5', splitTotal: '1' }),
		);

		expect(result).toStrictEqual({
			status: 'success',
			externalId: 'external-5',
			sqsMessageId: 'sqs-5',
		});
	});
});
