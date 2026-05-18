import { extractServerTiming } from './extractServerTiming';

describe('extractServerTiming', () => {
	it('should return "total" server timing value in milliseconds if header is present', () => {
		const mockHeaders = new Headers({
			'server-timing': 'total;dur=123.45, db;dur=67.89',
		});
		const serverTiming = extractServerTiming(mockHeaders);
		expect(serverTiming).toBe(123.45);
	});

	it('should return undefined if server-timing header is not present', () => {
		const mockHeaders = new Headers({});
		const serverTiming = extractServerTiming(mockHeaders);
		expect(serverTiming).toBeUndefined();
	});

	it('should return undefined if "total" timing is not present in header', () => {
		const mockHeaders = new Headers({
			'server-timing': 'db;dur=67.89',
		});
		const serverTiming = extractServerTiming(mockHeaders);
		expect(serverTiming).toBeUndefined();
	});

	it('should return undefined if "total" timing value is not a valid number', () => {
		const mockHeaders = new Headers({
			'server-timing': 'total;dur=abc, db;dur=67.89',
		});
		const serverTiming = extractServerTiming(mockHeaders);
		expect(serverTiming).toBeUndefined();
	});

	it('should return undefined if "total" timing value is NaN', () => {
		const mockHeaders = new Headers({
			'server-timing': 'total;dur=NaN, db;dur=67.89',
		});
		const serverTiming = extractServerTiming(mockHeaders);
		expect(serverTiming).toBeUndefined();
	});
});
