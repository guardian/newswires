import { isAlert } from './contentHelpers.ts';

describe('isAlert', () => {
	test('should be true when type is text and profile is alert', () => {
		expect(
			isAlert({
				profile: 'alert',
				type: 'text',
			}),
		).toBe(true);
	});
	test('should be false if type is not text', () => {
		expect(
			isAlert({
				profile: 'alert',
				type: 'other',
			}),
		).toBe(false);
	});
	test('should be false if type is not text', () => {
		expect(
			isAlert({
				profile: 'other',
				type: 'text',
			}),
		).toBe(false);
	});
});
