import type { SESEvent, SESHandler } from 'aws-lambda';
import { findVerificationFailures } from '../../shared/findVerificationFailures';
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
