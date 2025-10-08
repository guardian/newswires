import { initialiseDbConnection } from '../../shared/rds';
import { countQuery, getQuery, updateRecords } from './query';

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
	const totalToUpdate = await countQuery(
		sql,
		lastUpdatedSinceDate,
		lastUpdatedUntilDate,
	);

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
		const records = await getQuery(
			sql,
			batchSize,
			offset,
			lastUpdatedSinceDate,
			lastUpdatedUntilDate,
		);
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
