import type { SESReceipt } from 'aws-lambda';

export function findEmailVerificationFailures(receipt: SESReceipt) {
	const verdictChecks = [
		{ name: 'spamVerdict', status: receipt.spamVerdict.status },
		{ name: 'virusVerdict', status: receipt.virusVerdict.status },
		{ name: 'spfVerdict', status: receipt.spfVerdict.status },
		{ name: 'dkimVerdict', status: receipt.dkimVerdict.status },
		{ name: 'dmarcVerdict', status: receipt.dmarcVerdict.status },
	];

	const failedChecks = verdictChecks.filter(({ status }) => status !== 'PASS');

	return {
		hasFailures: failedChecks.length !== 0,
		failedChecks,
	};
}
