import type { Sql } from 'postgres';
import { initialiseDbConnection } from '../../shared/rds';

type DBRecord = {
	external_id: string;
	category_codes: string[];
};

async function getRecords(sql: Sql, limit: number) {
	const results =
		await sql`SELECT external_id, category_codes FROM fingerpost_wire_entry ORDER BY id LIMIT ${limit};`;
	return results.map((r) => r as DBRecord);
}

async function updateRecords(sql: Sql, records: DBRecord[]) {
	await sql`update fingerpost_wire_entry as fwe set last_updated_at = now() from (values ${sql(
		records.map((r) => [r.external_id] as const),
	)}) as data(external_id) where fwe.external_id = data.external_id;`;
}

export const main = async ({
	limit,
	timeDelay,
}: {
	limit: number;
	timeDelay: number;
}) => {
	const { sql, closeDbConnection } = await initialiseDbConnection();
	const records = await getRecords(sql, limit);
	console.log(`Fetched ${records.length} records from the database.`);
	await updateRecords(sql, records);
	console.log(`Updated ${records.length} records in the database.`);
	await new Promise((resolve) => setTimeout(resolve, timeDelay));
	await closeDbConnection();
};
