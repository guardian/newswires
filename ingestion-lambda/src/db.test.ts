import postgres from 'postgres';
import { DATABASE_TABLE_NAME } from '../../shared/constants';
import * as loggingModule from '../../shared/lambda-logging';
import { DATABASE_PORT } from '../../shared/rds';
import { putItemToDb } from './db';

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
		jest.clearAllMocks();
		jest.resetAllMocks();
		await sql`TRUNCATE TABLE ${sql(DATABASE_TABLE_NAME)};`;
	});

	afterAll(async () => {
		await sql.end();
	});

	it('should be able to insert an item into the database', async () => {
		await putItemToDb({
			processedObject: {
				content: {
					slug: 'test-slug',
					keywords: [],
					imageIds: [],
				},
				supplier: 'test-supplier',
				categoryCodes: ['code1', 'code2'],
			},
			externalId: 'test-external-id',
			s3Key: 'test-s3-key',
			sql: sql,
			logger: mockCreateLogger({}),
		});
		const results = await sql`SELECT * FROM ${sql(DATABASE_TABLE_NAME)};`;
		expect(results.length).toBe(1);
	});
});
