import { simpleParser } from 'mailparser';
import { getErrorMessage } from '../../shared/getErrorMessage';

export async function parseEmail(rawEmail: string) {
	try {
		const { from, subject, text, date } = await simpleParser(rawEmail);

		return {
			from: from?.text,
			subject,
			text: text ?? '',
			date: date ? date.toUTCString() : undefined,
		};
	} catch (error) {
		throw new Error(`Failed to parse email: ${getErrorMessage(error)}`, {
			cause: error,
		});
	}
}
