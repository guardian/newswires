import { clauses } from './query';

describe('clauses', () => {
	it('lastUpdatedSince and lastUpdatedUntil are both defined', () => {
		const lastUpdatedSince = new Date('2022-03-25');
		const lastUpdatedUntil = new Date('2022-03-26');
		expect(
			clauses({
				lastUpdatedSince,
				lastUpdatedUntil,
			}),
		).toStrictEqual([
			"last_updated_at >= '2022-03-25T00:00:00.000Z'",
			"last_updated_at <= '2022-03-26T00:00:00.000Z'",
		]);
	});
	it('lastUpdatedSince is defined', () => {
		const lastUpdatedSince = new Date('2022-03-25');
		expect(
			clauses({
				lastUpdatedSince,
			}),
		).toStrictEqual(["last_updated_at >= '2022-03-25T00:00:00.000Z'"]);
	});
	it('lastUpdatedUntil is defined', () => {
		const lastUpdatedUntil = new Date('2022-03-25');
		expect(
			clauses({
				lastUpdatedUntil,
			}),
		).toStrictEqual(["last_updated_at <= '2022-03-25T00:00:00.000Z'"]);
	});
	it('lastUpdatedSince and lastUpdatedUntil are not defined', () => {
		expect(clauses({})).toStrictEqual([]);
	});
	it('lastUpdatedIsEmpty is true', () => {
		expect(
			clauses({
				lastUpdatedAtIsEmpty: true,
			}),
		).toStrictEqual(['last_updated_at is null']);
	});
	it('lastUpdatedIsEmpty is false', () => {
		expect(
			clauses({
				lastUpdatedAtIsEmpty: false,
			}),
		).toStrictEqual(['last_updated_at is not null']);
	});
});
