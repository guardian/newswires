import {
	getEarliestTimeStamp,
	getLatestTimeStamp,
	sortByTimeStamp,
} from './timestamp-compare';

describe('sortByTimeStamp', () => {
	const timestamps = [
		'2025-01-01T00:00:00Z',
		'2025-01-03T12:30:00Z',
		'2025-01-02T15:45:30Z',
		'2025-01-01T23:59:59Z',
	];

	describe('descending order (default)', () => {
		it('should sort timestamps in descending order', () => {
			const sorted = [...timestamps].sort(sortByTimeStamp());
			expect(sorted).toEqual([
				'2025-01-03T12:30:00Z',
				'2025-01-02T15:45:30Z',
				'2025-01-01T23:59:59Z',
				'2025-01-01T00:00:00Z',
			]);
		});

		it('should sort with ascending: false', () => {
			const sorted = [...timestamps].sort(
				sortByTimeStamp({ ascending: false }),
			);
			expect(sorted).toEqual([
				'2025-01-03T12:30:00Z',
				'2025-01-02T15:45:30Z',
				'2025-01-01T23:59:59Z',
				'2025-01-01T00:00:00Z',
			]);
		});
	});

	describe('ascending order', () => {
		it('should sort timestamps in ascending order', () => {
			const sorted = [...timestamps].sort(sortByTimeStamp({ ascending: true }));
			expect(sorted).toEqual([
				'2025-01-01T00:00:00Z',
				'2025-01-01T23:59:59Z',
				'2025-01-02T15:45:30Z',
				'2025-01-03T12:30:00Z',
			]);
		});
	});

	describe('edge cases', () => {
		it('should handle empty array', () => {
			const sorted = [].sort(sortByTimeStamp());
			expect(sorted).toEqual([]);
		});

		it('should handle single timestamp', () => {
			const sorted = ['2025-01-01T00:00:00Z'].sort(sortByTimeStamp());
			expect(sorted).toEqual(['2025-01-01T00:00:00Z']);
		});

		it('should handle identical timestamps', () => {
			const duplicates = ['2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'];
			const sorted = [...duplicates].sort(sortByTimeStamp());
			expect(sorted).toEqual(duplicates);
		});
	});
});

describe('getLatestTimeStamp', () => {
	it('should return the latest timestamp from an array', () => {
		const timestamps = [
			'2025-01-01T00:00:00Z',
			'2025-01-03T12:30:00Z',
			'2025-01-02T15:45:30Z',
		];
		expect(getLatestTimeStamp(timestamps)).toBe('2025-01-03T12:30:00Z');
	});

	it('should return the only timestamp when array has one element', () => {
		const timestamps = ['2025-01-01T00:00:00Z'];
		expect(getLatestTimeStamp(timestamps)).toBe('2025-01-01T00:00:00Z');
	});

	it('should return undefined for empty array', () => {
		expect(getLatestTimeStamp([])).toBeUndefined();
	});

	it('should handle timestamps with same date but different times', () => {
		const timestamps = [
			'2025-01-01T00:00:00Z',
			'2025-01-01T23:59:59Z',
			'2025-01-01T12:00:00Z',
		];
		expect(getLatestTimeStamp(timestamps)).toBe('2025-01-01T23:59:59Z');
	});

	it('should handle identical timestamps', () => {
		const timestamps = ['2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'];
		expect(getLatestTimeStamp(timestamps)).toBe('2025-01-01T00:00:00Z');
	});

	it('should not modify the original array', () => {
		const timestamps = [
			'2025-01-01T00:00:00Z',
			'2025-01-03T12:30:00Z',
			'2025-01-02T15:45:30Z',
		];
		const original = [...timestamps];
		getLatestTimeStamp(timestamps);
		expect(timestamps).toEqual(original);
	});
});

describe('getEarliestTimeStamp', () => {
	it('should return the earliest timestamp from an array', () => {
		const timestamps = [
			'2025-01-03T12:30:00Z',
			'2025-01-01T00:00:00Z',
			'2025-01-02T15:45:30Z',
		];
		expect(getEarliestTimeStamp(timestamps)).toBe('2025-01-01T00:00:00Z');
	});

	it('should return the only timestamp when array has one element', () => {
		const timestamps = ['2025-01-01T00:00:00Z'];
		expect(getEarliestTimeStamp(timestamps)).toBe('2025-01-01T00:00:00Z');
	});

	it('should return undefined for empty array', () => {
		expect(getEarliestTimeStamp([])).toBeUndefined();
	});

	it('should handle timestamps with same date but different times', () => {
		const timestamps = [
			'2025-01-01T23:59:59Z',
			'2025-01-01T00:00:00Z',
			'2025-01-01T12:00:00Z',
		];
		expect(getEarliestTimeStamp(timestamps)).toBe('2025-01-01T00:00:00Z');
	});

	it('should handle identical timestamps', () => {
		const timestamps = ['2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'];
		expect(getEarliestTimeStamp(timestamps)).toBe('2025-01-01T00:00:00Z');
	});

	it('should not modify the original array', () => {
		const timestamps = [
			'2025-01-03T12:30:00Z',
			'2025-01-01T00:00:00Z',
			'2025-01-02T15:45:30Z',
		];
		const original = [...timestamps];
		getEarliestTimeStamp(timestamps);
		expect(timestamps).toEqual(original);
	});
});
