import type { PendingQuery, Row, Sql } from 'postgres';
import { DATABASE_TABLE_NAME } from '../../shared/constants';
import { computePresetCategories } from '../../shared/precomputeCategories';

export type DBRecord = {
	external_id: string;
	category_codes: string[];
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
	lastUpdatedSince?: Date,
	lastUpdatedUntil?: Date,
): Promise<DBRecord[]> => {
	const conditions = whereClause(sql, { lastUpdatedSince, lastUpdatedUntil });
	const where = conditions.length
		? conditions.reduce(
				(prev, curr, i) => {
					if (i === 0) return sql`where ${curr}`;
					return sql`${prev} and ${curr}`;
				},
				sql``,
			)
		: sql``;
	const results =
		await sql`SELECT external_id, category_codes FROM ${sql(DATABASE_TABLE_NAME)} ${where} ORDER BY id LIMIT ${limit} OFFSET ${offset};`;
	return results.map((r: Row) => {
		return r as DBRecord;
	});
};
const countQuery = async (
	sql: Sql,
	lastUpdatedSince?: Date,
	lastUpdatedUntil?: Date,
) => {
	const conditions = whereClause(sql, { lastUpdatedSince, lastUpdatedUntil });
	const where = conditions.length
		? conditions.reduce(
				(prev, curr, i) => {
					if (i === 0) return sql`where ${curr}`;
					return sql`${prev} and ${curr}`;
				},
				sql``,
			)
		: sql``;

	const results =
		await sql`SELECT COUNT(*) FROM ${sql(DATABASE_TABLE_NAME)} ${where}`;
	if (results.length > 0 && results[0] !== undefined)
		return Number(results[0].count);
	return 0;
};

const whereConditions = {
	lastUpdatedSince: (lastUpdatedSince: Date) =>
		`last_updated_at >= '${lastUpdatedSince.toISOString()}'`,
	lastUpdatedUntil: (lastUpdatedUntil: Date) =>
		`last_updated_at <= '${lastUpdatedUntil.toISOString()}'`,
} as const;
type WhereKey = keyof typeof whereConditions;
const whereClause = (
	sql: Sql,
	params: {
		lastUpdatedSince?: Date;
		lastUpdatedUntil?: Date;
	},
): Array<PendingQuery<Row[]>> => {
	const conditions = Object.entries(params)
		.map(([k, v]) => {
			if (k in whereConditions) {
				const key = k as WhereKey;
				return whereConditions[key](v);
			} else return undefined;
		})
		.filter((p) => p !== undefined);
	return conditions.map((c) => sql`${c}`);
};

export { getQuery, countQuery };
