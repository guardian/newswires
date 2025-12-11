import type { SESEvent, SESHandler } from 'aws-lambda';
import { findVerificationFailures } from 'newswires-shared/findVerificationFailures';
import { createLogger } from 'newswires-shared/lambda-logging';

const logger = createLogger({});

export const main: SESHandler = async (event: SESEvent) => {
	for (const record of event.Records) {
		const message = record.ses;

		const { pass, failedChecks } = await findVerificationFailures(message);

		if (!pass) {
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
