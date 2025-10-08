/* eslint-disable @typescript-eslint/no-unsafe-assignment -- need to fix */

import type { Sql } from 'postgres';
import { computePresetCategories } from '../../shared/precomputeCategories';
import { initialiseDbConnection } from '../../shared/rds';
import { countQuery, getQuery } from './query';

type DBRecord = {
	external_id: string;
	category_codes: string[];
};

async function getRecords(
	sql: Sql,
	limit: number,
	offset: number,
	lastUpdatedSince?: Date,
	lastUpdatedAfter?: Date,
): Promise<DBRecord[]> {
	const query = sql.unsafe(
		getQuery(limit, offset, lastUpdatedSince, lastUpdatedAfter),
	);
	const results = await query;
	return results.map((r) => {
		return { external_id: r.external_id, category_codes: r.category_codes };
	});
}

async function updateRecords(sql: Sql, records: DBRecord[]) {
	const values = records.map((r) => [
		r.external_id,
		`{${computePresetCategories(r.category_codes)
			.map((c) => `"${c}"`)
			.join(',')}}`,
	]);
	await sql`UPDATE fingerpost_wire_entry AS fwe
        SET 
            last_updated_at = NOW(), 
            precomputed_categories = data.precomputed_categories::text[]
        FROM (
            VALUES ${sql(values)}
        ) AS data(external_id, precomputed_categories)
        WHERE fwe.external_id = data.external_id;
    `;
}

function computeOffsets(max: number, batchSize: number): number[] {
	const batches = Math.ceil(max / batchSize);
	return Array.from({ length: batches }, (_, i) => i * batchSize);
}

export const main = async ({
	limit,
	batchSize,
	timeDelay,
	lastUpdatedSince,
	lastUpdatedUntil,
}: {
	limit: number;
	batchSize: number;
	timeDelay: number;
	lastUpdatedSince: string | undefined;
	lastUpdatedUntil: string | undefined;
}) => {
	const { sql, closeDbConnection } = await initialiseDbConnection();
	const lastUpdatedSinceDate = lastUpdatedSince
		? new Date(lastUpdatedSince)
		: undefined;
	const lastUpdatedUntilDate = lastUpdatedUntil
		? new Date(lastUpdatedUntil)
		: undefined;
	const countResponse = await sql.unsafe(
		countQuery(lastUpdatedSinceDate, lastUpdatedUntilDate),
	);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- testing
	const totalToUpdate = Number(countResponse.map((r) => r.count)[0]);
	console.info(
		`There are ${totalToUpdate} records for updating from the query`,
	);
	const effectiveLimit = Math.min(limit, totalToUpdate);
	console.log(
		`Will update up to ${effectiveLimit} records, user has set limit to ${limit}`,
	);
	const offsets = computeOffsets(effectiveLimit, batchSize);
	console.info(
		`Starting to update up to ${effectiveLimit} records in batches of ${batchSize}`,
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
	console.info(`Finished updating ${effectiveLimit} records`);
};
