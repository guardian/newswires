import { getErrorMessage } from '../../shared/getErrorMessage';
import { initialiseDbConnection } from '../../shared/rds';
import { TABLE_NAME } from './database';

export const main = async (): Promise<void> => {
	const { sql, closeDbConnection } = await initialiseDbConnection();

	try {
		const result = await sql`
            DELETE
            FROM ${sql(TABLE_NAME)}
            WHERE ingested_at < NOW() - INTERVAL '14 days';
        `;

		console.log(`Deleted ${result.count} records`);
	} catch (error) {
		console.error('Error deleting old records:', getErrorMessage(error));
	} finally {
		await closeDbConnection();
	}
};
