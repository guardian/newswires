import type { SESReceipt } from 'aws-lambda';
import { findEmailVerificationFailures } from './findEmailVerificationFailures';

describe('findEmailVerificationFailures', () => {
	it('should return passed as true when all checks pass', () => {
		const receipt = {
			spamVerdict: { status: 'PASS' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'PASS' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as SESReceipt;
		const result = findEmailVerificationFailures(receipt);
		expect(result.hasFailures).toBe(false);
		expect(result.failedChecks).toEqual([]);
	});

	it('should return passed as false when any check fails', () => {
		const receipt = {
			spamVerdict: { status: 'FAIL' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'PASS' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as SESReceipt;
		const result = findEmailVerificationFailures(receipt);
		expect(result.hasFailures).toBe(true);
		expect(result.failedChecks).toEqual([
			{ name: 'spamVerdict', status: 'FAIL' },
		]);
	});

	it('should return multiple failed checks', () => {
		const receipt = {
			spamVerdict: { status: 'FAIL' },
			virusVerdict: { status: 'FAIL' },
			spfVerdict: { status: 'PASS' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as SESReceipt;
		const result = findEmailVerificationFailures(receipt);
		expect(result.hasFailures).toBe(true);
		expect(result.failedChecks).toEqual([
			{ name: 'spamVerdict', status: 'FAIL' },
			{ name: 'virusVerdict', status: 'FAIL' },
		]);
	});
});
