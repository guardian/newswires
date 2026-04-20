import moment from 'moment-timezone';
import { ZonedMoment } from './formatTimestamp';

Date.now = jest.fn(() => new Date('2020-05-13T02:33:37.000Z').getTime());

describe('ZonedTimestamp', () => {
	const nowUtc = moment();
	describe('formatListView', () => {
		test('it should provide just the time when the date is today', () => {
			expect(
				new ZonedMoment(nowUtc, 'Australia/Sydney').format({
					type: 'list',
					nowUtc,
				}),
			).toBe('12:33:37');
			expect(
				new ZonedMoment(nowUtc, 'Europe/London').format({
					type: 'list',
					nowUtc,
				}),
			).toBe('03:33:37');
		});

		test('it should provide the full date and time when the date is not today', () => {
			const dayBefore = moment().subtract(1, 'day');
			expect(
				new ZonedMoment(dayBefore, 'America/New_York').format({
					type: 'list',
					nowUtc,
				}),
			).toBe('2020/05/11, 22:33:37');
			expect(
				new ZonedMoment(dayBefore, 'America/Los_Angeles').format({
					type: 'list',
					nowUtc,
				}),
			).toBe('2020/05/11, 19:33:37');
			expect(
				new ZonedMoment(dayBefore, 'Australia/Sydney').format({
					type: 'list',
					nowUtc,
				}),
			).toBe('2020/05/12, 12:33:37');
			expect(
				new ZonedMoment(dayBefore, 'Europe/London').format({
					type: 'list',
					nowUtc,
				}),
			).toBe('2020/05/12, 03:33:37');
		});
	});
});
