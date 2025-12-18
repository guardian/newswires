import { getErrorMessage } from '@guardian/libs';
import { simpleParser } from 'mailparser';
import type {
	IngestorInputBody,
	OperationResult,
	ProcessedObject,
} from '../../shared/types';

type EmailObject = {
	from?: string;
	subject?: string;
	text?: string;
	date?: string;
};

// The newswires client is expecting the headline of the dotcopy content to include
// a colon, as it uses this to strip out the subject
export const constructHeadline = (from?: string, subject?: string) => {
	return `from ${from ?? 'Unknown'}: ${subject ?? 'No Subject'}`;
};

export async function processEmailContent(
	rawEmail: string,
): Promise<OperationResult<ProcessedObject>> {
	try {
		const { from, subject, text, date } = await parseEmail(rawEmail);

		const content: IngestorInputBody = {
			headline: constructHeadline(from, subject),
			body_text: text ?? '',
			sourceFeed: 'email',
			firstVersion: date ?? new Date().toUTCString(),
			keywords: [],
			imageIds: [],
		};

		return {
			supplier: 'UNAUTHED_EMAIL_FEED',
			categoryCodes: [],
			content,
			status: 'success',
		};
	} catch (error) {
		throw new Error(`Failed to parse email: ${getErrorMessage(error)}`, {
			cause: error,
		});
	}
}

export async function parseEmail(rawEmail: string): Promise<EmailObject> {
	try {
		const parsed = await simpleParser(rawEmail);
		return {
			from: parsed.from?.text,
			subject: parsed.subject,
			text: parsed.textAsHtml,
			date: parsed.date?.toUTCString(),
		};
	} catch (error) {
		throw new Error(`Failed to parse email: ${getErrorMessage(error)}`, {
			cause: error,
		});
	}
}
