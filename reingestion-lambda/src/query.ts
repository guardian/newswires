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
	let baseQuery = `SELECT external_id, category_codes FROM ${DATABASE_TABLE_NAME}`;
	const conditions = whereClause(sql, { lastUpdatedSince, lastUpdatedUntil });
	if (conditions.length > 0) {
		baseQuery += ` WHERE ${conditions.join(' AND ')}`;
	}
	baseQuery += ` ORDER BY id LIMIT ${limit} OFFSET ${offset};`;
	const results = await sql`${baseQuery}`;
	return results.map((r) => {
		return { external_id: r.external_id, category_codes: r.category_codes };
	});
};
const countQuery = async (
	sql: Sql,
	lastUpdatedSince?: Date,
	lastUpdatedUntil?: Date,
) => {
	let baseQuery = sql`SELECT COUNT(*) FROM ${DATABASE_TABLE_NAME}`;
	const conditions = whereClause(sql, { lastUpdatedSince, lastUpdatedUntil });
	if (conditions.length > 0) {
		baseQuery = sql`${baseQuery} WHERE ${conditions.join(' AND ')}`;
	}
	const results = await sql(`${baseQuery}`);
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
			if (k !== undefined && k in whereConditions && v !== undefined) {
				const key = k as WhereKey;
				return whereConditions[key](v);
			}
		})
		.filter((p) => p !== undefined);
	return conditions.map((c) => sql`${c}`);
};

export { getQuery, countQuery };
