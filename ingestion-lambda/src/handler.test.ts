import type { SESEvent, SQSEvent, SQSRecord } from 'aws-lambda';
import type postgres from 'postgres';
import type { Row, RowList } from 'postgres';
import * as rdsModule from '../../shared/rds';
import * as s3Module from '../../shared/s3';
import { main } from './handler';

type SuccessfulSqlInsertReturnType = RowList<Row[]> | Promise<RowList<Row[]>>;

// mock the s3 sdk module
jest.mock('../../shared/s3', () => ({
	putToS3: jest.fn(),
	BUCKET_NAME: 'test-bucket',
}));
// and the postgres sql module
jest.mock('../../shared/rds', () => ({
	initialiseDbConnection: jest.fn(),
}));

const mockPutToS3 = s3Module.putToS3 as jest.MockedFunction<
	typeof s3Module.putToS3
>;
const mockInitialiseDbConnection =
	rdsModule.initialiseDbConnection as jest.MockedFunction<
		typeof rdsModule.initialiseDbConnection
	>;

function generateMockSQSRecord({
	bodyPayload,
	externalId,
	messageId = '123',
}: {
	bodyPayload: Record<string, string> | string;
	externalId: string;
	messageId: string;
}): SQSRecord {
	return {
		messageAttributes: {
			'Message-Id': {
				stringValue: externalId,
			},
		},
		messageId,
		body:
			typeof bodyPayload === 'string'
				? bodyPayload
				: JSON.stringify(bodyPayload),
	} as unknown as SQSRecord;
}

describe('handler.main', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	it('should process SQS messages and return no batchItemFailures if everything succeeds', async () => {
		// Mock database to simulate successful insertion
		mockInitialiseDbConnection.mockResolvedValue({
			sql: (() =>
				Promise.resolve([
					{ id: 1 },
				] as unknown as SuccessfulSqlInsertReturnType)) as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		const validSQSRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: {
				slug: 'slug-123',
			},
			externalId: 'ext-123',
			messageId: 'VALID_RECORD_ID',
		});

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(0);
	});

	it('should return failed messages when content processing fails', async () => {
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
			bodyPayload: {
				externalId: 'ext-123',
				objectKey: 'path/to/object.json',
			},
			externalId: 'ext-123',
			messageId: 'VALID_RECORD_ID',
		});

		const failingSQSRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: '{ invalid json content',
			externalId: 'ext-failing',
			messageId: 'FAILING_RECORD_ID',
		});

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord, failingSQSRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(1);
		expect(result?.batchItemFailures[0]?.itemIdentifier).toBe(
			'FAILING_RECORD_ID',
		);
	});

	it('should handle missing external ids', async () => {
		// Mock database to simulate successful insertion
		mockInitialiseDbConnection.mockResolvedValue({
			sql: (() =>
				Promise.resolve([
					{ id: 1 },
				] as unknown as SuccessfulSqlInsertReturnType)) as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		// Create a valid record and a record that will fail due to invalid JSON from S3
		const validSQSRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: {
				slug: 'test-slug',
			},
			externalId: 'ext-valid',
			messageId: 'VALID_RECORD_ID',
		});

		const invalidJsonRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: {
				slug: 'test-slug',
			},
			externalId: '',
			messageId: 'FAILING_RECORD_ID',
		});

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord, invalidJsonRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(1);
		expect(result?.batchItemFailures[0]?.itemIdentifier).toBe(
			'FAILING_RECORD_ID',
		);
	});

	it('should handle database writing failures', async () => {
		const mockSql = jest.fn();
		mockSql
			.mockResolvedValueOnce('table-name') // First call to format table name
			.mockResolvedValueOnce([{ id: 1 }]) // Second call to insert first item (successful)
			.mockResolvedValueOnce('table-name') // First call to format table name for the second record
			.mockRejectedValueOnce(new Error('Database write failed')); // Second call to insert second item (failed)

		// Mock database to simulate successful insertion
		mockInitialiseDbConnection.mockResolvedValue({
			sql: mockSql as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		// Create two valid records that will both pass S3 and processing steps
		const successRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: {
				slug: 'test-slug',
			},
			externalId: 'ext-success',
			messageId: 'SUCCESS_RECORD_ID',
		});

		const dbFailRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: {
				slug: 'test-slug',
			},
			externalId: 'ext-db-fail',
			messageId: 'DB_FAIL_RECORD_ID',
		});
		const mockSQSEvent: SQSEvent = {
			Records: [successRecord, dbFailRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(1);
		expect(result?.batchItemFailures[0]?.itemIdentifier).toBe(
			'DB_FAIL_RECORD_ID',
		);

		expect(mockSql).toHaveBeenCalledTimes(4); // Each insert operation calls the sql function twice (to format table name and then run the query)
	});

	it('should handle S3 storage failures gracefully', async () => {
		// Mock database to simulate successful connection
		mockInitialiseDbConnection.mockResolvedValue({
			sql: (() =>
				Promise.resolve([
					{ id: 1 },
				] as unknown as SuccessfulSqlInsertReturnType)) as unknown as postgres.Sql,
			closeDbConnection: jest.fn(),
		});

		// Mock S3 to fail when storing the raw body
		mockPutToS3.mockRejectedValueOnce(new Error('S3 storage failed'));

		const validSQSRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: { slug: 'test-slug' },
			externalId: 'ext-123',
			messageId: 'S3_FAIL_RECORD_ID',
		});

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord],
		};

		const result = await main(mockSQSEvent);

		expect(result).toBeDefined();
		expect(result?.batchItemFailures.length).toBe(1);
		expect(result?.batchItemFailures[0]?.itemIdentifier).toBe(
			'S3_FAIL_RECORD_ID',
		);
	});

	it('should throw if the initial database connection fails', async () => {
		mockInitialiseDbConnection.mockRejectedValue(
			new Error('Database connection failed'),
		);

		const validSQSRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: { slug: 'test-slug' },
			externalId: 'ext-123',
			messageId: 'DB_CONNECTION_FAIL',
		});

		const mockSQSEvent: SQSEvent = {
			Records: [validSQSRecord],
		};

		// Database connection failure should cause the entire handler to fail
		await expect(main(mockSQSEvent)).rejects.toThrow(
			'Database connection failed',
		);
	});

	it('should return early when it receives an SES event', async () => {
		const sesEvent = {
			Records: [
				{
					ses: {
						mail: { commonHeaders: { subject: 'Test' } },
					},
					eventSource: 'aws:ses',
				},
			],
		} as unknown as SESEvent;

		const result = await main(sesEvent);

		expect(result).toBeUndefined();
		expect(mockInitialiseDbConnection).not.toHaveBeenCalled();
	});
});
