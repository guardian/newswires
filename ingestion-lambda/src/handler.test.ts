import type { SQSEvent, SQSRecord } from 'aws-lambda';
import type postgres from 'postgres';
import type { Row, RowList } from 'postgres';
import * as rdsModule from '../../shared/rds';
import * as s3Module from '../../shared/s3';
import type { OperationResult } from '../../shared/types';
import { main } from './handler';

type SuccessfulSqlInsertReturnType = RowList<Row[]> | Promise<RowList<Row[]>>;

// mock the s3 sdk module
jest.mock('../../shared/s3', () => ({
	getFromS3: jest.fn(),
	putToS3: jest.fn(),
	BUCKET_NAME: 'test-bucket',
}));
// and the postgres sql module
jest.mock('../../shared/rds', () => ({
	initialiseDbConnection: jest.fn(),
}));

const mockGetFromS3 = s3Module.getFromS3 as jest.MockedFunction<
	typeof s3Module.getFromS3
>;
const mockInitialiseDbConnection =
	rdsModule.initialiseDbConnection as jest.MockedFunction<
		typeof rdsModule.initialiseDbConnection
	>;

const validJsonFromSuccessfulS3: OperationResult<{ body: string }> = {
	status: 'success',
	body: JSON.stringify({
		'source-feed': 'AP-Newswires',
		slug: 'test-slug',
	}),
};

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

	it('should handle mixed success and failure scenarios', async () => {
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
				externalId: 'ext-valid',
				objectKey: 'path/to/valid-object.json',
			},
			externalId: 'ext-valid',
			messageId: 'VALID_RECORD_ID',
		});

		const invalidJsonRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: {
				externalId: 'ext-invalid',
				objectKey: 'path/to/invalid-object.json',
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
		// Mock S3 to return valid JSON for both records
		mockGetFromS3.mockResolvedValue(validJsonFromSuccessfulS3);

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
				externalId: 'ext-success',
				objectKey: 'path/to/success-object.json',
			},
			externalId: 'ext-success',
			messageId: 'SUCCESS_RECORD_ID',
		});

		const dbFailRecord: SQSRecord = generateMockSQSRecord({
			bodyPayload: {
				externalId: 'ext-db-fail',
				objectKey: 'path/to/db-fail-object.json',
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
});
