import { countQuery, getQuery } from './query';

describe('getQuery', () => {
	it('should return correct query without date filters', () => {
		const query = getQuery(10, 0);
		expect(query).toBe(
			'SELECT external_id, category_codes FROM fingerpost_wire_entry ORDER BY id LIMIT 10 OFFSET 0;',
		);
	});
	it('should return correct query with lastUpdatedSince filter', () => {
		const date = new Date('2023-01-01T00:00:00Z');
		const query = getQuery(10, 0, date);
		expect(query).toBe(
			`SELECT external_id, category_codes FROM fingerpost_wire_entry WHERE last_updated_at >= '2023-01-01T00:00:00.000Z' ORDER BY id LIMIT 10 OFFSET 0;`,
		);
	});
	it('should return correct query with lastUpdatedAfter filter', () => {
		const date = new Date('2023-01-01T00:00:00Z');
		const query = getQuery(10, 0, undefined, date);
		expect(query).toBe(
			`SELECT external_id, category_codes FROM fingerpost_wire_entry WHERE last_updated_at <= '2023-01-01T00:00:00.000Z' ORDER BY id LIMIT 10 OFFSET 0;`,
		);
	});
	it('should return correct query with both date filters', () => {
		const sinceDate = new Date('2023-01-01T00:00:00Z');
		const afterDate = new Date('2023-02-01T00:00:00Z');
		const query = getQuery(10, 0, sinceDate, afterDate);
		expect(query).toBe(
			`SELECT external_id, category_codes FROM fingerpost_wire_entry WHERE last_updated_at >= '2023-01-01T00:00:00.000Z' AND last_updated_at <= '2023-02-01T00:00:00.000Z' ORDER BY id LIMIT 10 OFFSET 0;`,
		);
	});
});

describe('countQuery', () => {
	it('should return correct count query without date filters', () => {
		const query = countQuery();
		expect(query).toBe('SELECT COUNT(*) FROM fingerpost_wire_entry;');
	});
	it('should return correct count query with lastUpdatedSince filter', () => {
		const date = new Date('2023-01-01T00:00:00Z');
		const query = countQuery(date);
		expect(query).toBe(
			`SELECT COUNT(*) FROM fingerpost_wire_entry WHERE last_updated_at >= '2023-01-01T00:00:00.000Z';`,
		);
	});
	it('should return correct count query with lastUpdatedAfter filter', () => {
		const untilDate = new Date('2023-01-01T00:00:00Z');
		const query = countQuery(undefined, untilDate);
		expect(query).toBe(
			`SELECT COUNT(*) FROM fingerpost_wire_entry WHERE last_updated_at <= '2023-01-01T00:00:00.000Z';`,
		);
	});
	it('should return correct query with both date filters', () => {
		const sinceDate = new Date('2023-01-01T00:00:00Z');
		const untilDate = new Date('2023-02-01T00:00:00Z');
		const query = countQuery(sinceDate, untilDate);
		expect(query).toBe(
			`SELECT COUNT(*) FROM fingerpost_wire_entry WHERE last_updated_at >= '2023-01-01T00:00:00.000Z' AND last_updated_at <= '2023-02-01T00:00:00.000Z';`,
		);
	});
});
