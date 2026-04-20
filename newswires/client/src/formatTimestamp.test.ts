import moment from 'moment-timezone';
import { ZonedMoment } from './formatTimestamp';

moment.now = () => new Date('2020-05-13T02:33:37.000Z').getTime();

describe('ZonedMoment', () => {
	describe('format', () => {
		const nowUtc = moment('2020-05-13T02:33:37.000Z');
		const fiveMinsAgo = moment('2020-05-13T02:28:37.000Z');
		test('it should format wireDetail with a readable full date and time', () => {
			expect(
				new ZonedMoment(nowUtc, 'Australia/Sydney').format({
					type: 'wireDetail',
				}),
			).toBe('May 13th 2020, 12:33:37');
		});
		test('it should format full with a utc timestampe', () => {
			expect(
				new ZonedMoment(nowUtc, 'Australia/Sydney').format({
					type: 'full',
				}),
			).toBe('2020-05-13T12:33:37+10:00');
		});
		test('it should format relative with the difference between the timestamp and right now', () => {
			expect(
				new ZonedMoment(fiveMinsAgo, 'Australia/Sydney').format({
					type: 'relative',
				}),
			).toContain('5 minutes');
		});
		test('it should format settings with the hours and minutes', () => {
			expect(
				new ZonedMoment(nowUtc, 'Australia/Sydney').format({
					type: 'settings',
				}),
			).toBe('12:33');
		});
		describe('list', () => {
			test('it should provide just the time when the date is today', () => {
				expect(
					new ZonedMoment(fiveMinsAgo, 'Australia/Sydney').format({
						type: 'list',
						nowUtc,
					}),
				).toBe('12:28:37');
				expect(
					new ZonedMoment(fiveMinsAgo, 'Europe/London').format({
						type: 'list',
						nowUtc,
					}),
				).toBe('03:28:37');
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
});
