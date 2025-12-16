import type { SESMail, SESReceipt } from 'aws-lambda';
import { findVerificationFailures } from './findVerificationFailures';

jest.mock('./s3.ts', () => ({
	getFromS3: jest.fn().mockResolvedValue({
		status: 'success',
		body: ``,
	}),
}));
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
	it('should return hasFailures false and empty failedChecks for all PASS verdicts', async () => {
		const receipt = {
			spamVerdict: { status: 'PASS' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'PASS' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as unknown as SESReceipt;
		const result = await findVerificationFailures({ receipt, mail });
		expect(result.pass).toBe(true);
		expect(result.failedChecks).toEqual([]);
	});

	it('should return hasFailures true and failedChecks for ALL failing verdicts', async () => {
		const receipt = {
			spamVerdict: { status: 'FAIL' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'FAIL' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'FAIL' },
		} as unknown as SESReceipt;

		const result = await findVerificationFailures({ receipt, mail });
		expect(result.pass).toBe(false);
		expect(result.failedChecks).toEqual([
			{ name: 'spamVerdict', status: 'FAIL' },
			{ name: 'spfVerdict', status: 'FAIL' },
			{ name: 'dmarcVerdict', status: 'FAIL' },
		]);
	});

	// This test requires a fully logged email to be included. We don't want to commit one to this public repo,
	// but it's handy to use this to debug, so it's left here commented out in case it's useful in the future.
	it.skip('should run mail verification for mail which failed spf ONLY', async () => {
		const receipt = {
			spamVerdict: { status: 'PASS' },
			virusVerdict: { status: 'PASS' },
			spfVerdict: { status: 'FAIL' },
			dkimVerdict: { status: 'PASS' },
			dmarcVerdict: { status: 'PASS' },
		} as unknown as SESReceipt;

		const result = await findVerificationFailures({ receipt, mail });
		expect(result.failedChecks).toBe([]);
		expect(result.pass).toBe(true);
	});
});
