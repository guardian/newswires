import type { SESMessage } from 'aws-lambda';
import { authenticate } from 'mailauth';
import { getFromEnv, isRunningLocally } from './config';
import { getFromS3 } from './s3';

type EmailVerificationCheck = {
	name: string;
	status: string;
};
type EmailVerificationResult = {
	pass: boolean;
	failedChecks: EmailVerificationCheck[];
};

const EMAIL_BUCKET_NAME: string = isRunningLocally
	? 'local-email-bucket'
	: getFromEnv('EMAIL_BUCKET_NAME');

const DOTCOPY_EMAIL_PUBLIC_ADDRESS = isRunningLocally
	? 'test.example'
	: getFromEnv('DOTCOPY_EMAIL_PUBLIC_ADDRESS');

const dotcopyUsernameEnd = DOTCOPY_EMAIL_PUBLIC_ADDRESS.indexOf('@');
const dotcopyUsername = DOTCOPY_EMAIL_PUBLIC_ADDRESS.slice(
	0,
	dotcopyUsernameEnd,
);

const validForCopy = (forAddress: string): boolean => {
	const validCopyAddresses = [
		`${dotcopyUsername}@guardian.co.uk`,
		`${dotcopyUsername}@theguardian.com`,
	];

	// forAddress seems to (sometimes?) come through wrapped in angle brackets...
	// trim those off
	if (forAddress.startsWith('<')) {
		return validCopyAddresses.includes(
			forAddress.slice(1, forAddress.length - 1),
		);
	}
	return validCopyAddresses.includes(forAddress);
};

export async function findVerificationFailures(
	message: SESMessage,
): Promise<EmailVerificationResult> {
	const { receipt } = message;

	const sesVerdictChecks = [
		{ name: 'spamVerdict', status: receipt.spamVerdict.status },
		{ name: 'virusVerdict', status: receipt.virusVerdict.status },
		{ name: 'spfVerdict', status: receipt.spfVerdict.status },
		{ name: 'dkimVerdict', status: receipt.dkimVerdict.status },
		{ name: 'dmarcVerdict', status: receipt.dmarcVerdict.status },
	];

	const sesFailedChecks = sesVerdictChecks.filter(
		({ status }) => status !== 'PASS',
	);

	if (sesFailedChecks.length === 0) {
		console.log(`Email validation for ${message.mail.messageId}: PASS`);
		return { pass: true, failedChecks: [] };
	}

	if (
		sesFailedChecks.length === 1 &&
		sesFailedChecks[0]?.name === 'spfVerdict'
	) {
		const mailObject = await getFromS3({
			bucketName: EMAIL_BUCKET_NAME,
			key: message.mail.messageId,
		});
		if (mailObject.status === 'failure') {
			throw new Error(mailObject.reason);
		}

		const { arc, receivedChain } = await authenticate(mailObject.body, {
			trustReceived: true,
		});

		const wasSentToDotCopy = receivedChain?.some((chainLink) => {
			const value = chainLink.for?.value;
			return value ? validForCopy(value) : false;
		});

		const arcValid =
			arc &&
			arc.status.result === 'pass' &&
			arc.signature &&
			arc.signature.signingDomain === 'google.com' &&
			arc.signature.status.result === 'pass' &&
			arc.authenticationResults?.mta === 'mx.google.com' &&
			(arc.authenticationResults.spf as undefined | { result?: string })
				?.result === 'pass';

		if (!wasSentToDotCopy) {
			return {
				pass: false,
				failedChecks: [{ name: 'sent_to_dotcopy', status: 'FAIL' }],
			};
		} else if (!arcValid) {
			return {
				pass: false,
				failedChecks: [{ name: 'newswires_arc_spf_check', status: 'FAIL' }],
			};
		} else {
			return { pass: true, failedChecks: [] };
		}
	}

	return {
		pass: sesFailedChecks.length === 0,
		failedChecks: sesFailedChecks,
	};
}
