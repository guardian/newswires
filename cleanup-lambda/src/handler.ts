import {
	DATABASE_TABLE_NAME,
	TOOL_LINK_TABLE_NAME,
} from '../../shared/constants';
import { getErrorMessage } from '../../shared/getErrorMessage';
import { initialiseDbConnection } from '../../shared/rds';

export const main = async (): Promise<void> => {
	const { sql, closeDbConnection } = await initialiseDbConnection();
	try {
		// delete wire and any associated tool links
		const result = await sql`
			WITH deleted_wire AS (
				DELETE FROM ${sql(DATABASE_TABLE_NAME)}
				WHERE ingested_at < NOW() - INTERVAL '14 days'
				RETURNING id
			)
			DELETE FROM ${sql(TOOL_LINK_TABLE_NAME)}
			WHERE wire_id IN (
				SELECT id FROM deleted_wire
			);
		`;

		console.log(`Deleted ${result.count} records`);
	} catch (error) {
		console.error('Error deleting old records:', getErrorMessage(error));
	} finally {
		await closeDbConnection();
	}
};
