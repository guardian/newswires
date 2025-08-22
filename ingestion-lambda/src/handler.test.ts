import type {
	SESEvent,
	SESEventRecord,
	SESReceiptStatus,
	SQSBatchResponse,
	SQSEvent,
	SQSRecord,
} from 'aws-lambda';
import type postgres from 'postgres';
import type { Row, RowList } from 'postgres';
import * as loggingModule from '../../shared/lambda-logging';
import * as rdsModule from '../../shared/rds';
import * as s3Module from '../../shared/s3';
import type { OperationResult } from '../../shared/types';
import { main } from './handler';
import { sampleMimeEmailData } from './sampleMimeEmailData';

type SuccessfulSqlInsertReturnType = RowList<Row[]> | Promise<RowList<Row[]>>;

// mock the s3 sdk module
jest.mock('../../shared/s3', () => ({
	getFromS3: jest.fn(),
	putToS3: jest.fn(),
	FEEDS_BUCKET_NAME: 'test-feeds-bucket',
	EMAIL_BUCKET_NAME: 'test-email-bucket',
}));
// and the postgres sql module
jest.mock('../../shared/rds', () => ({
	initialiseDbConnection: jest.fn(),
}));
// and even the lambda-logging module
jest.mock('../../shared/lambda-logging', () => {
	const logs = {
		log: jest.fn(),
		debug: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	};

	return {
		createLogger: () => logs,
	};
});

const mockGetFromS3 = s3Module.getFromS3 as jest.MockedFunction<
	typeof s3Module.getFromS3
>;
const mockInitialiseDbConnection =
	rdsModule.initialiseDbConnection as jest.MockedFunction<
		typeof rdsModule.initialiseDbConnection
	>;
const mockCreateLogger = loggingModule.createLogger;

const validJsonFromSuccessfulS3: OperationResult<{ body: string }> = {
	status: 'success',
	body: JSON.stringify({
		'source-feed': 'AP-Newswires',
		slug: 'test-slug',
	}),
};

const invalidJsonFromSuccessfulS3: OperationResult<{ body: string }> = {
	status: 'success',
	body: '{ invalid json content without closing brace',
};

const failedS3Result = {
	status: 'failure',
	sqsMessageId: '123',
	reason: 'S3 access denied',
} as OperationResult<{ body: string }>;

function generateMockSQSRecord(
	bodyPayload: Record<string, string>,
	messageId = '123',
): SQSRecord {
	return {
		messageId,
		body: JSON.stringify(bodyPayload),
	} as unknown as SQSRecord;
}

describe('handler.main', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	it('should process SQS messages and return no batchItemFailures if everything succeeds', async () => {
		// Mock S3 to return a valid JSON body
		mockGetFromS3.mockResolvedValue(validJsonFromSuccessfulS3);

		// Mock database to simulate successful insertion
		mockInitialiseDbConnection.mockResolvedValue({
			sql: (() =>
				Promise.resolve([
					{ id: 1 },
				] as unknown as SuccessfulSqlInsertReturnType)) as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		const validSQSRecord: SQSRecord = generateMockSQSRecord({
			externalId: 'ext-123',
			objectKey: 'path/to/object.json',
		});

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(0);
		expect(mockCreateLogger({}).error).toHaveBeenCalledTimes(0);
	});

	it('should handle mixed success and failure scenarios', async () => {
		// Mock S3 to return a valid JSON body
		mockGetFromS3.mockResolvedValue(validJsonFromSuccessfulS3);

		// Mock database to simulate successful insertion
		mockInitialiseDbConnection.mockResolvedValue({
			sql: (() =>
				Promise.resolve([
					{ id: 1 },
				] as unknown as SuccessfulSqlInsertReturnType)) as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		// Create a valid record and a failing record (missing externalId)
		const validSQSRecord: SQSRecord = generateMockSQSRecord({
			externalId: 'ext-123',
			objectKey: 'path/to/object.json',
		});

		const failingSQSRecord: SQSRecord = generateMockSQSRecord(
			{
				objectKey: 'path/to/failing-object.json', // Missing externalId
			},
			'FAILING_RECORD_ID',
		);

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord, failingSQSRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(1);
		expect(result?.batchItemFailures[0]?.itemIdentifier).toBe(
			'FAILING_RECORD_ID',
		);
		// assert logline for ingestion failure metrics
		expect(mockCreateLogger({}).error).toHaveBeenCalledTimes(1);
		expect(
			(
				mockCreateLogger({}).error as jest.MockedFn<
					loggingModule.Logger['error']
				>
			).mock.calls[0]?.[0].eventType,
		).toBe('INGESTION_FAILURE');

		// Verify S3 was only called once (for the valid record)
		expect(mockGetFromS3).toHaveBeenCalledTimes(1);
		expect(mockGetFromS3).toHaveBeenCalledWith({
			bucketName: 'test-feeds-bucket',
			key: 'path/to/object.json',
		});
	});

	it('should handle S3 content parsing failures', async () => {
		// Mock database to simulate successful insertion
		mockInitialiseDbConnection.mockResolvedValue({
			sql: (() =>
				Promise.resolve([
					{ id: 1 },
				] as unknown as SuccessfulSqlInsertReturnType)) as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});
		// Mock S3 to return different responses for different keys
		mockGetFromS3.mockImplementation((params) => {
			if (params.key === 'path/to/valid-object.json') {
				return Promise.resolve(validJsonFromSuccessfulS3);
			} else if (params.key === 'path/to/invalid-object.json') {
				return Promise.resolve(invalidJsonFromSuccessfulS3);
			}
			return Promise.resolve(failedS3Result);
		});

		// Create a valid record and a record that will fail due to invalid JSON from S3
		const validSQSRecord: SQSRecord = generateMockSQSRecord(
			{
				externalId: 'ext-valid',
				objectKey: 'path/to/valid-object.json',
			},
			'VALID_RECORD_ID',
		);

		const invalidJsonRecord: SQSRecord = generateMockSQSRecord(
			{
				externalId: 'ext-invalid',
				objectKey: 'path/to/invalid-object.json',
			},
			'INVALID_JSON_RECORD_ID',
		);

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord, invalidJsonRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(1);
		expect(result?.batchItemFailures[0]?.itemIdentifier).toBe(
			'INVALID_JSON_RECORD_ID',
		);

		// Verify S3 was called for both records
		expect(mockGetFromS3).toHaveBeenCalledTimes(2);
		expect(mockGetFromS3).toHaveBeenCalledWith({
			bucketName: 'test-feeds-bucket',
			key: 'path/to/valid-object.json',
		});
		expect(mockGetFromS3).toHaveBeenCalledWith({
			bucketName: 'test-feeds-bucket',
			key: 'path/to/invalid-object.json',
		});
	});

	it('should handle database writing failures', async () => {
		// Mock S3 to return valid JSON for both records
		mockGetFromS3.mockResolvedValue(validJsonFromSuccessfulS3);

		const mockSql = jest.fn();
		mockSql
			.mockResolvedValueOnce('table-name') // First call simulates a successful insert
			.mockResolvedValueOnce([{ id: 1 }])
			.mockResolvedValueOnce('table-name') // First call simulates a successful insert
			.mockRejectedValueOnce(new Error('Database write failed'));

		mockInitialiseDbConnection.mockResolvedValue({
			sql: mockSql as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		// Create two valid records that will both pass S3 and processing steps
		const successRecord: SQSRecord = generateMockSQSRecord(
			{
				externalId: 'ext-success',
				objectKey: 'path/to/success-object.json',
			},
			'SUCCESS_RECORD_ID',
		);

		const dbFailRecord: SQSRecord = generateMockSQSRecord(
			{
				externalId: 'ext-db-fail',
				objectKey: 'path/to/db-fail-object.json',
			},
			'DB_FAIL_RECORD_ID',
		);
		const mockSQSEvent: SQSEvent = {
			Records: [successRecord, dbFailRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(1);
		expect(result?.batchItemFailures[0]?.itemIdentifier).toBe(
			'DB_FAIL_RECORD_ID',
		);

		expect(mockGetFromS3).toHaveBeenCalledTimes(2);
		expect(mockSql).toHaveBeenCalledTimes(4);
	});

	it('should throw if the initial database connection fails', async () => {
		mockInitialiseDbConnection.mockRejectedValue(
			new Error('Database connection failed'),
		);

		const validSQSRecord: SQSRecord = generateMockSQSRecord(
			{
				externalId: 'ext-123',
				objectKey: 'path/to/object.json',
			},
			'DB_CONNECTION_FAIL',
		);

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord],
		};

		// Database connection failure should cause the entire handler to fail
		await expect(main(mockSQSEvent)).rejects.toThrow(
			'Database connection failed',
		);
	});

	it('should be able to process an SES event', async () => {
		mockGetFromS3.mockResolvedValue({
			status: 'success',
			body: sampleMimeEmailData,
		});

		const mockSql = jest.fn();
		mockSql.mockResolvedValue([{ id: 1 }]);

		mockInitialiseDbConnection.mockResolvedValue({
			sql: mockSql as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		const passingSesEvent = {
			Records: [createSesRecord('PASS')],
		} as unknown as SESEvent;

		const result = (await main(passingSesEvent)) as SQSBatchResponse;

		expect(result.batchItemFailures).toHaveLength(0);
		expect(mockInitialiseDbConnection).toHaveBeenCalled();
	});

	it('should fail if SES verification contains non-PASS values', async () => {
		mockGetFromS3.mockResolvedValue({
			status: 'success',
			body: sampleMimeEmailData,
		});

		const mockSql = jest.fn();
		mockSql.mockResolvedValue([{ id: 1 }]);

		mockInitialiseDbConnection.mockResolvedValue({
			sql: mockSql as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		const failingSesEvent = {
			Records: [createSesRecord('GRAY')],
		} as unknown as SESEvent;

		const result = (await main(failingSesEvent)) as SQSBatchResponse;

		expect(result.batchItemFailures).toEqual([{ itemIdentifier: '123' }]);
	});
});

function createSesRecord(
	spamStatus: SESReceiptStatus['status'],
): SESEventRecord {
	return {
		ses: {
			mail: { commonHeaders: { subject: 'Test' }, messageId: '123' },
			receipt: {
				spamVerdict: { status: spamStatus },
				virusVerdict: { status: 'PASS' },
				spfVerdict: { status: 'PASS' },
				dkimVerdict: { status: 'PASS' },
				dmarcVerdict: { status: 'PASS' },
			},
		},
		eventSource: 'aws:ses',
	} as unknown as SESEventRecord;
}
