import type { SESReceipt } from 'aws-lambda';
import type { ParsedMail } from 'mailparser';
import { simpleParser } from 'mailparser';

export function findVerificationFailures(receipt: SESReceipt) {
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

export async function parseEmail(
	rawEmail: string,
): Promise<ParsedMail | undefined> {
	try {
		const parsed = await simpleParser(rawEmail);
		return parsed;
	} catch (error) {
		console.error('Failed to parse email body:', error);
		return undefined;
	}
}

export async function processSesMessages(rawEmail: string) {
	const parsedEmail = await parseEmail(rawEmail);
	if (!parsedEmail) {
		throw new Error('Failed to parse email');
	}

	const { from, subject, text, headers } = parsedEmail;

	// convert headers from a Map to a plain object with lowercase keys
	const headersObject = Object.fromEntries(
		Array.from(headers.entries()).map(([key, value]) => [
			key.toLowerCase(),
			typeof value === 'string' ? value : value.toString(),
		]),
	);

	return {
		from: from?.text,
		subject,
		text: text ?? '',
		headers: headersObject,
	};
}
