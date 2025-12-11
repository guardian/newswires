import type { SESMail, SESReceipt } from 'aws-lambda';
import { findVerificationFailures } from './findVerificationFailures';

describe('findVerificationFailures', () => {
	const mail: SESMail = {
		timestamp: '',
		source: '',
		messageId: '',
		destination: [],
		headersTruncated: false,
		headers: [],
		commonHeaders: {
			returnPath: '',
			date: '',
			messageId: '',
		},
	};
	it('should return hasFailures false and empty failedChecks for all PASS verdicts', () => {
		const receipt = {
			spamVerdict: { status: 'PASS' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'PASS' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as unknown as SESReceipt;
		const result = findVerificationFailures({ receipt, mail });
		expect(result.hasFailures).toBe(false);
		expect(result.failedChecks).toEqual([]);
	});

	it('should return hasFailures true and failedChecks for ALL failing verdicts', () => {
		const receipt = {
			spamVerdict: { status: 'FAIL' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'FAIL' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'FAIL' },
		} as unknown as SESReceipt;

		const result = findVerificationFailures({ receipt, mail });
		expect(result.hasFailures).toBe(true);
		expect(result.failedChecks).toEqual([
			{ name: 'spamVerdict', status: 'FAIL' },
			{ name: 'spfVerdict', status: 'FAIL' },
			{ name: 'dmarcVerdict', status: 'FAIL' },
		]);
	});
});
