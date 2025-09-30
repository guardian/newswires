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
	console.log(records[0]);
	await new Promise((resolve) => setTimeout(resolve, timeDelay));
	await closeDbConnection();
};
