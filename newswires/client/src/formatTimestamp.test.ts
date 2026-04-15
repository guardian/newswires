import moment from 'moment-timezone';
import { formatTimestamp, TimezonedMoment } from './formatTimestamp';

Date.now = jest.fn(() => new Date('2020-05-13T02:33:37.000Z').getTime());

describe('formatTimestamp', () => {
	test('it should provide just the time when the date is today', () => {
		const now = new TimezonedMoment(moment());
		expect(formatTimestamp(now, 'Australia/Sydney')).toBe('12:33:37');
		expect(formatTimestamp(now, 'Europe/London')).toBe('03:33:37');
	});

	test('it should provide the full date and time when the date is not today', () => {
		const dayBefore = new TimezonedMoment(moment().subtract(1, 'day'));
		expect(formatTimestamp(dayBefore, 'America/New_York')).toBe(
			'2020/05/11, 22:33:37',
		);
		expect(formatTimestamp(dayBefore, 'America/Los_Angeles')).toBe(
			'2020/05/11, 19:33:37',
		);
		expect(formatTimestamp(dayBefore, 'Australia/Sydney')).toBe(
			'2020/05/12, 12:33:37',
		);
		expect(formatTimestamp(dayBefore, 'Europe/London')).toBe(
			'2020/05/12, 03:33:37',
		);
	});
});
