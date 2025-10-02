import postgres from 'postgres';
import { DATABASE_TABLE_NAME } from '../../shared/constants';
import * as loggingModule from '../../shared/lambda-logging';
import { putItemToDb } from './db';

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
const mockCreateLogger = loggingModule.createLogger;

describe('putItemToDb', () => {
	const sql = postgres({
		port: 55432,
		hostname: 'localhost',
		username: 'postgres',
		database: 'newswires',
		password: 'testpassword',
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await sql`TRUNCATE TABLE ${sql(DATABASE_TABLE_NAME)};`;
	});

	afterAll(async () => {
		await sql.end();
	});
	const exampleProcessedObject = {
		content: {
			slug: 'test-slug',
			keywords: [],
			imageIds: [],
		},
		supplier: 'test-supplier',
		categoryCodes: ['code1', 'code2'],
	};

	it('should be able to insert an item into the database', async () => {
		await putItemToDb({
			processedObject: exampleProcessedObject,
			externalId: 'test-external-id-1',
			s3Key: 'test-s3-key',
			sql: sql,
			logger: mockCreateLogger({}),
		});
		const results = await sql`SELECT * FROM ${sql(DATABASE_TABLE_NAME)};`;
		expect(results.length).toBe(1);
	});
	it('should persist lastModified date if provided', async () => {
		const lastModified = new Date('2023-01-01T12:00:00Z');
		await putItemToDb({
			processedObject: exampleProcessedObject,
			externalId: 'test-external-id-2',
			s3Key: 'test-s3-key',
			lastModified,
			sql: sql,
			logger: mockCreateLogger({}),
		});
		const results =
			await sql`SELECT ingested_at FROM ${sql(DATABASE_TABLE_NAME)}`;
		const ingestedAt = (results[0] as { ingested_at: Date }).ingested_at;
		expect(ingestedAt).toBeDefined();
		expect(new Date(ingestedAt).toISOString()).toBe(lastModified.toISOString());
	});
	it('should use current date for ingested_at if lastModified is not provided', async () => {
		const before = new Date();
		await putItemToDb({
			processedObject: exampleProcessedObject,
			externalId: 'test-external-id-3',
			s3Key: 'test-s3-key',
			lastModified: undefined,
			sql: sql,
			logger: mockCreateLogger({}),
		});
		const after = new Date();
		const results =
			await sql`SELECT ingested_at FROM ${sql(DATABASE_TABLE_NAME)}`;
		const ingestedAt = (results[0] as { ingested_at: Date }).ingested_at;
		expect(ingestedAt).toBeDefined();
		expect(new Date(ingestedAt).getTime()).toBeGreaterThanOrEqual(
			before.getTime(),
		);
		expect(new Date(ingestedAt).getTime()).toBeLessThanOrEqual(after.getTime());
	});
	it('should insert a persisted_at time', async () => {
		await putItemToDb({
			processedObject: exampleProcessedObject,
			externalId: 'test-external-id-4',
			s3Key: 'test-s3-key',
			lastModified: undefined,
			sql: sql,
			logger: mockCreateLogger({}),
		});
		const now = new Date();
		const results =
			await sql`SELECT persisted_at FROM ${sql(DATABASE_TABLE_NAME)}`;
		const persistedAt = (results[0] as { persisted_at: Date }).persisted_at;
		expect(persistedAt).toBeDefined();
		expect(
			Math.abs(now.getTime() - new Date(persistedAt).getTime()),
		).toBeLessThanOrEqual(1000);
	});
});
