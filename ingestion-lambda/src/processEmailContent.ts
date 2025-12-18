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

// This regex matches all break tags that aren't immediately followed by
// another break tag. For `textAsHtml`, this will remove all line breaks
// from the automatically added wrapping, while paragraphs formed by
// double breaks added by the email author will be reduced to a single break.
// This does mean that paragraphs formed by authors by a single linebreak will
// be indistinguishable from a break added for wrapping, so the two paragraphs
// will be merged into one, but this behaviour is consistent with old wires,
// meaning no regressions and we can always investigate improvements later.
// It does look like the parser will replace a double linebreak by ending the
// current <p> tag and starting a new one.
const matchNonwrappingBreakTags = /<br\/>(?!<br\/>)/g;

export async function parseEmail(rawEmail: string): Promise<EmailObject> {
	try {
		const parsed = await simpleParser(rawEmail);
		const text = parsed.textAsHtml?.replaceAll(matchNonwrappingBreakTags, ' ');

		return {
			from: parsed.from?.text,
			subject: parsed.subject,
			text: text,
			date: parsed.date?.toUTCString(),
		};
	} catch (error) {
		throw new Error(`Failed to parse email: ${getErrorMessage(error)}`, {
			cause: error,
		});
	}
}
