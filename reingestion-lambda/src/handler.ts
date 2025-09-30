import type { Sql } from 'postgres';
import { initialiseDbConnection } from '../../shared/rds';
import { AllSports } from './presetcategories';

type DBRecord = {
	external_id: string;
	category_codes: string[];
};

async function getRecords(sql: Sql, limit: number) {
	const results =
		await sql`SELECT external_id, category_codes FROM fingerpost_wire_entry ORDER BY id LIMIT ${limit};`;
	return results.map((r) => r as DBRecord);
}

const computePresetCategories = (categoryCodes: string[]) => {
	return categoryCodes.filter((code) => AllSports.includes(code)).length > 0
		? ['all-sports']
		: [];
};
const toPostgressArray = (classifications: string[]) => {
	if (classifications.length === 0) return 'ARRAY[]::text[]';
	return `ARRAY[${classifications.map((c) => `'${c}'`).join(',')}]`;
};
async function updateRecords(sql: Sql, records: DBRecord[]) {
	const values = records
		.map(
			(record) =>
				`('${record.external_id}', ${toPostgressArray(computePresetCategories(record.category_codes))})`,
		)
		.join(',');
	await sql.unsafe(`
        UPDATE fingerpost_wire_entry AS fwe
        SET 
            last_updated_at = NOW(), 
            preset_categories = data.preset_categories
        FROM (
            VALUES ${values}
        ) AS data(external_id, preset_categories)
        WHERE fwe.external_id = data.external_id;
    `);
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
