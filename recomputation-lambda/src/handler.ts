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
	lastUpdatedAtIsEmpty,
}: {
	limit: number;
	batchSize: number;
	timeDelay: number;
	lastUpdatedSince: string | undefined;
	lastUpdatedUntil: string | undefined;
	lastUpdatedAtIsEmpty: boolean | undefined;
}) => {
	const { sql, closeDbConnection } = await initialiseDbConnection();

	const params = {
		...(lastUpdatedSince && { lastUpdatedSince: new Date(lastUpdatedSince) }),
		...(lastUpdatedUntil && { lastUpdatedUntil: new Date(lastUpdatedUntil) }),
		...(lastUpdatedAtIsEmpty !== undefined && { lastUpdatedAtIsEmpty }),
	};
	console.log(`Running with params: ${JSON.stringify(params)}`);

	const totalToUpdate = await countQuery(sql, params);

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
		const records = await getQuery(sql, batchSize, offset, params);
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
