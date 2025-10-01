import type { Sql } from 'postgres';
import { computePresetCategories } from '../../shared/presetCategories';
import { initialiseDbConnection } from '../../shared/rds';

type DBRecord = {
	external_id: string;
	category_codes: string[];
};

async function getRecords(sql: Sql, limit: number, offset: number) {
	const results =
		await sql`SELECT external_id, category_codes FROM fingerpost_wire_entry ORDER BY id LIMIT ${limit} offset ${offset};`;
	return results.map((r) => r as DBRecord);
}

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
	await sql.unsafe(`UPDATE fingerpost_wire_entry AS fwe
        SET 
            last_updated_at = NOW(), 
            preset_categories = data.preset_categories
        FROM (
            VALUES ${values}
        ) AS data(external_id, preset_categories)
        WHERE fwe.external_id = data.external_id;
    `);
}

function computeOffsets(max: number, batchSize: number): number[] {
	const batches = Math.ceil(max / batchSize);
	return Array.from({ length: batches }, (_, i) => i * batchSize);
}

export const main = async ({
	limit,
	batchSize,
	timeDelay,
}: {
	limit: number;
	batchSize: number;
	timeDelay: number;
}) => {
	const { sql, closeDbConnection } = await initialiseDbConnection();
	const offsets = computeOffsets(limit, batchSize);
	console.info(
		`Starting to update up to ${limit} records in batches of ${batchSize}`,
	);
	for (const [index, offset] of offsets.entries()) {
		const records = await getRecords(sql, batchSize, offset);
		console.info(`Processing batch ${index + 1} of ${offsets.length}`);
		if (records.length === 0) {
			console.info('No more records to process, exiting');
			return;
		}
		console.info(`Updating ${records.length} records`);
		await updateRecords(sql, records);
		console.info(`Finished processing batch ${index + 1} of ${offsets.length}`);
		await new Promise((resolve) => setTimeout(resolve, timeDelay));
	}
	await closeDbConnection();
	console.info(`Finished updating ${limit} records`);
};
