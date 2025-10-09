import type { Row, Sql } from 'postgres';
import { DATABASE_TABLE_NAME } from '../../shared/constants';
import { computePresetCategories } from '../../shared/precomputeCategories';

export type DBRecord = {
	external_id: string;
	category_codes: string[];
};

export type WhereParams = {
	lastUpdatedSince?: Date;
	lastUpdatedUntil?: Date;
	lastUpdatedAtIsEmpty?: boolean;
};

export const updateRecords = async (sql: Sql, records: DBRecord[]) => {
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
};
const getQuery = async (
	sql: Sql,
	limit: number,
	offset: number,
	whereParams: WhereParams,
): Promise<DBRecord[]> => {
	const where = whereClause(sql, whereParams);
	const results =
		await sql`SELECT external_id, category_codes FROM ${sql(DATABASE_TABLE_NAME)} ${where} ORDER BY id LIMIT ${limit} OFFSET ${offset};`;
	return results.map((r: Row) => {
		return r as DBRecord;
	});
};
const countQuery = async (sql: Sql, whereParams: WhereParams) => {
	const where = whereClause(sql, whereParams);
	const results =
		await sql`SELECT COUNT(*) FROM ${sql(DATABASE_TABLE_NAME)} ${where}`;
	if (results.length > 0 && results[0] !== undefined)
		return Number(results[0].count);
	return 0;
};

const whereConditions = {
	lastUpdatedSince: (sql: Sql, lastUpdatedSince: Date) =>
		sql`last_updated_at >= ${lastUpdatedSince.toISOString()}`,
	lastUpdatedUntil: (sql: Sql, lastUpdatedUntil: Date) =>
		sql`last_updated_at <= ${lastUpdatedUntil.toISOString()}`,
	lastUpdatedAtIsEmpty: (sql: Sql, isEmpty: boolean) =>
		isEmpty ? sql`last_updated_at is null` : sql`last_updated_at is not null`,
} as const;

const whereClause = (sql: Sql, whereParams: WhereParams) => {
	const parts = [];
	if (whereParams.lastUpdatedSince)
		parts.push(
			whereConditions.lastUpdatedSince(sql, whereParams.lastUpdatedSince),
		);
	if (whereParams.lastUpdatedUntil)
		parts.push(
			whereConditions.lastUpdatedUntil(sql, whereParams.lastUpdatedUntil),
		);
	if (whereParams.lastUpdatedAtIsEmpty !== undefined)
		parts.push(
			whereConditions.lastUpdatedAtIsEmpty(
				sql,
				whereParams.lastUpdatedAtIsEmpty,
			),
		);

	if (parts.length === 0) return sql``;
	return parts.reduce(
		(prev, curr, i) => {
			if (i === 0) return sql`where ${curr}`;
			return sql`${prev} and ${curr}`;
		},
		sql``,
	);
};

export { getQuery, countQuery };
