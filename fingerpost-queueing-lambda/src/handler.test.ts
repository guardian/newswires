import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { putToS3AndQueueIngestion } from 'newswires-shared/putToS3AndQueueIngestion';
import { fileService } from 'newswires-shared/s3';
import type { MockedFunction } from 'vitest';
import { main } from './handler';

const mockLogger = {
	log: vi.fn(),
	debug: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};

vi.mock('newswires-shared/config', () => ({
	feedsBucket: () => 'test-feeds-bucket',
}));

vi.mock('newswires-shared/lambda-logging', () => {
	return {
		createLogger: () => mockLogger,
	};
});

vi.mock('newswires-shared/putToS3AndQueueIngestion', () => ({
	putToS3AndQueueIngestion: vi.fn(),
}));

vi.mock('newswires-shared/s3', () => ({
	fileService: {
		putObject: vi.fn(),
	},
}));

const mockPutToS3AndQueueIngestion = putToS3AndQueueIngestion as MockedFunction<
	typeof putToS3AndQueueIngestion
>;
const mockPutObject = fileService.putObject as MockedFunction<
	typeof fileService.putObject
>;

type TestRecordOptions = {
	messageId?: string;
	externalId?: string;
	splitTotal?: string;
	body?: string;
};

function createSqsEvent(options: TestRecordOptions = {}): SQSEvent {
	const { messageId, body, externalId, splitTotal } = options;
	const messageAttributes: Record<string, { stringValue: string }> = {};
	if (externalId !== undefined) {
		messageAttributes['Message-Id'] = {
			stringValue: externalId,
		};
	}
	if (splitTotal !== undefined) {
		messageAttributes['Message-Split-Total'] = { stringValue: splitTotal };
	}
	const record = {
		messageId,
		messageAttributes,
		body,
	} as unknown as SQSRecord;
	return {
		Records: [record],
	};
}

describe('handler.main', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetAllMocks();
	});
	const validRecord = {
		externalId: 'external-1',
		body: '{"test":"body"}',
		messageId: 'sqs-1',
	};
	const noExternalId = {
		body: '{"test":"body"}',
		messageId: 'sqs-1',
	};
	const splitTotal = {
		...validRecord,
		splitTotal: '2',
	};
	it('queues ingestion when the message is valid', async () => {
		mockPutToS3AndQueueIngestion.mockResolvedValue({ status: 'success' });
		const result = await main(createSqsEvent(validRecord));

		expect(result.batchItemFailures).toEqual([]);
		expect(mockPutToS3AndQueueIngestion).toHaveBeenCalledWith({
			externalId: validRecord.externalId,
			keyPrefix: 'fingerpost-queueing-lambda',
			body: validRecord.body,
		});
		expect(mockPutObject).not.toHaveBeenCalled();
	});

	it('stores the message in S3 when there is no external id with GuMissingExternalId prefix', async () => {
		mockPutObject.mockResolvedValue({
			status: 'success',
			response: {} as never,
		});

		const result = await main(createSqsEvent(noExternalId));

		expect(result.batchItemFailures).toEqual([]);
		expect(mockPutToS3AndQueueIngestion).not.toHaveBeenCalled();
		expect(mockLogger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: 'FINGERPOST_QUEUEING_LAMBDA_NO_EXTERNAL_ID',
			}),
		);
		expect(mockPutObject).toHaveBeenCalledWith({
			bucketName: 'test-feeds-bucket',
			key: `GuMissingExternalId/${noExternalId.messageId}.json`,
			body: noExternalId.body,
		});
	});

	it('stores the message in S3 when splitTotal is greater than 1 with GuFileTooLarge prefix', async () => {
		mockPutObject.mockResolvedValue({
			status: 'success',
			response: {} as never,
		});

		const result = await main(createSqsEvent(splitTotal));

		expect(result.batchItemFailures).toEqual([]);
		expect(mockPutToS3AndQueueIngestion).not.toHaveBeenCalled();
		expect(mockLogger.error).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: 'FINGERPOST_QUEUEING_LAMBDA_PROCESSING_ERROR',
			}),
		);
		expect(mockPutObject).toHaveBeenCalledWith({
			bucketName: 'test-feeds-bucket',
			key: `GuFileTooLarge/${splitTotal.externalId}.json`,
			body: splitTotal.body,
		});
	});
	it('returns a batchItemFailure if the putToS3AndQueueIngestion fails', async () => {
		mockPutToS3AndQueueIngestion.mockResolvedValue({
			status: 'failure',
			reason: 'Test failure',
		});

		const result = await main(createSqsEvent(validRecord));

		expect(result.batchItemFailures).toEqual([
			{ itemIdentifier: validRecord.messageId },
		]);
		expect(mockLogger.error).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: 'FINGERPOST_QUEUEING_LAMBDA_PROCESSING_ERROR',
				sqsMessageId: validRecord.messageId,
				externalId: validRecord.externalId,
				reason: 'Test failure',
			}),
		);
	});
	it('returns a batchItemFailure if the putToS3 fails', async () => {
		mockPutObject.mockResolvedValue({
			status: 'failure',
			reason: 'Test failure',
		});

		const result = await main(createSqsEvent(noExternalId));

		expect(result.batchItemFailures).toEqual([
			{ itemIdentifier: validRecord.messageId },
		]);
		expect(mockLogger.error).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: 'FINGERPOST_QUEUEING_LAMBDA_PROCESSING_ERROR',
				sqsMessageId: noExternalId.messageId,
				reason: 'Test failure',
			}),
		);
	});
});
