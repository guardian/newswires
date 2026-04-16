import moment from 'moment-timezone';
import { ZonedMoment } from './formatTimestamp';

Date.now = jest.fn(() => new Date('2020-05-13T02:33:37.000Z').getTime());

describe('ZonedTimestamp', () => {
	describe('formatListView', () => {
		test('it should provide just the time when the date is today', () => {
			expect(
				new ZonedMoment(moment(), 'Australia/Sydney').formatListView(),
			).toBe('12:33:37');
			expect(new ZonedMoment(moment(), 'Europe/London').formatListView()).toBe(
				'03:33:37',
			);
		});

		test('it should provide the full date and time when the date is not today', () => {
			const dayBefore = moment().subtract(1, 'day');
			expect(
				new ZonedMoment(dayBefore, 'America/New_York').formatListView(),
			).toBe('2020/05/11, 22:33:37');
			expect(
				new ZonedMoment(dayBefore, 'America/Los_Angeles').formatListView(),
			).toBe('2020/05/11, 19:33:37');
			expect(
				new ZonedMoment(dayBefore, 'Australia/Sydney').formatListView(),
			).toBe('2020/05/12, 12:33:37');
			expect(new ZonedMoment(dayBefore, 'Europe/London').formatListView()).toBe(
				'2020/05/12, 03:33:37',
			);
		});
	});
});
