import { getErrorMessage } from '@guardian/libs';
import { DATABASE_TABLE_NAME } from '../../shared/constants';
import { initialiseDbConnection } from '../../shared/rds';

export const main = async (): Promise<void> => {
	const { sql, closeDbConnection } = await initialiseDbConnection();
	try {
		const result = await sql`
            DELETE
            FROM ${sql(DATABASE_TABLE_NAME)}
            WHERE ingested_at < NOW() - INTERVAL '14 days';
        `;

		console.log(`Deleted ${result.count} records`);
	} catch (error) {
		console.error('Error deleting old records:', getErrorMessage(error));
	} finally {
		await closeDbConnection();
	}
};
