import moment from 'moment-timezone';
import { ZonedMoment } from './ZonedMoment';

describe('ZonedMoment', () => {
	describe('format', () => {
		const nowUtc = moment('2020-05-13T02:33:37.000Z');
		const fiveMinsAgo = moment('2020-05-13T02:28:37.000Z');
		test('it should format humanFull with a readable full date and time', () => {
			expect(
				new ZonedMoment(nowUtc, 'Australia/Sydney').format({
					type: 'humanFull',
				}),
			).toBe('May 13th 2020, 12:33:37');
		});
		test('it should format isoString with a local iso format', () => {
			expect(
				new ZonedMoment(nowUtc, 'Australia/Sydney').format({
					type: 'isoString',
				}),
			).toBe('2020-05-13T12:33:37+10:00');
		});
		test('it should format relative with the difference between the timestamp and right now', () => {
			moment.now = () => new Date('2020-05-13T02:33:37.000Z').getTime();
			expect(
				new ZonedMoment(fiveMinsAgo, 'Australia/Sydney').format({
					type: 'relative',
				}),
			).toContain('5 minutes');
		});
		test('it should format shortTime with the hours and minutes', () => {
			expect(
				new ZonedMoment(nowUtc, 'Australia/Sydney').format({
					type: 'shortTime',
				}),
			).toBe('12:33');
		});
		describe('contextAware', () => {
			test('it should provide just the time when the date is today', () => {
				expect(
					new ZonedMoment(fiveMinsAgo, 'Australia/Sydney').format({
						type: 'contextAware',
						nowUtc,
					}),
				).toBe('12:28:37');
				expect(
					new ZonedMoment(fiveMinsAgo, 'Europe/London').format({
						type: 'contextAware',
						nowUtc,
					}),
				).toBe('03:28:37');
			});

			test('it should provide the full date and time when the date is not today', () => {
				const dayBefore = moment.utc('2020-05-12T02:33:37.000Z');
				expect(
					new ZonedMoment(dayBefore, 'America/New_York').format({
						type: 'contextAware',
						nowUtc,
					}),
				).toBe('2020/05/11, 22:33:37');
				expect(
					new ZonedMoment(dayBefore, 'America/Los_Angeles').format({
						type: 'contextAware',
						nowUtc,
					}),
				).toBe('2020/05/11, 19:33:37');
				expect(
					new ZonedMoment(dayBefore, 'Australia/Sydney').format({
						type: 'contextAware',
						nowUtc,
					}),
				).toBe('2020/05/12, 12:33:37');
				expect(
					new ZonedMoment(dayBefore, 'Europe/London').format({
						type: 'contextAware',
						nowUtc,
					}),
				).toBe('2020/05/12, 03:33:37');
			});
		});
	});
});
