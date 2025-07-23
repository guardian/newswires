import type { SESEvent, SESHandler, SESReceipt } from 'aws-lambda';
import { createLogger } from '../../shared/lambda-logging';

const logger = createLogger({});

export const main: SESHandler = (event: SESEvent) => {
	for (const record of event.Records) {
		const receipt = record.ses.receipt;

		const { hasFailures, failedChecks } = findVerificationFailures(receipt);

		if (hasFailures) {
			logger.error({
				message: 'Email verification failed',
				failedChecks: failedChecks.map(
					(check) => `${check.name}: ${check.status}`,
				),
			});
			continue;
		}

		console.log('Email verification passed');
	}
};

function findVerificationFailures(receipt: SESReceipt) {
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
