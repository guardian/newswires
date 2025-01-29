import { TABLE_NAME } from "./config";
import { createDbConnection } from './rds';

export const main = async (): Promise<void> => {
	const sql = await createDbConnection();

	try {
		const result = await sql`
            DELETE
            FROM ${sql(TABLE_NAME)}
            WHERE ingested_at < NOW() - INTERVAL '14 days'
                RETURNING *;
        `;

		console.log(`Deleted ${result.count} records`);
	} catch (error) {
		console.error('Error deleting old records:', error);
	} finally {
		await sql.end();
	}
};
