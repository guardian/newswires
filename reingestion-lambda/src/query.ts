import { DATABASE_TABLE_NAME } from '../../shared/constants';

const getQuery = (
	limit: number,
	offset: number,
	lastUpdatedSince?: Date,
	lastUpdatedUntil?: Date,
) => {
	let baseQuery = `SELECT external_id, category_codes FROM ${DATABASE_TABLE_NAME}`;
	const where = whereClause(lastUpdatedSince, lastUpdatedUntil);
	if (where) {
		baseQuery += where;
	}
	baseQuery += ` ORDER BY id LIMIT ${limit} OFFSET ${offset};`;
	return `${baseQuery}`;
};
const countQuery = (lastUpdatedSince?: Date, lastUpdatedUntil?: Date) => {
	let baseQuery = `SELECT COUNT(*) FROM ${DATABASE_TABLE_NAME}`;
	const where = whereClause(lastUpdatedSince, lastUpdatedUntil);
	if (where) {
		baseQuery += where;
	}
	baseQuery += `;`;

	return `${baseQuery}`;
};

const whereClause = (
	lastUpdatedSince?: Date,
	lastUpdatedUntil?: Date,
): string | undefined => {
	if (!lastUpdatedSince && !lastUpdatedUntil) return undefined;
	const conditions = [];
	if (lastUpdatedSince) {
		conditions.push(`last_updated_at >= '${lastUpdatedSince.toISOString()}'`);
	}
	if (lastUpdatedUntil) {
		conditions.push(`last_updated_at <= '${lastUpdatedUntil.toISOString()}'`);
	}
	return ' WHERE ' + conditions.join(' AND ');
};

export { getQuery, countQuery };
