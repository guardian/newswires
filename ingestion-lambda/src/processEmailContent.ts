import { getErrorMessage } from '@guardian/libs';
import { simpleParser } from 'mailparser';
import type {
	IngestorInputBody,
	OperationResult,
	ProcessedObject,
} from 'newswires-shared/types';
import {
	HTMLElement,
	parse as htmlParse,
	type Node,
	TextNode,
} from 'node-html-parser';

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

const startNewParagraphElements = ['BR', 'DIV', 'BLOCKQUOTE', 'LI', 'P'];

export function traverse(root: Node) {
	const stack = [root];
	const paragraphs = [];
	let currentParagraph = '';

	while (stack.length > 0) {
		const el = stack.pop();

		if (el instanceof TextNode) {
			currentParagraph += el.trimmedRawText;
		} else {
			if (
				el instanceof HTMLElement &&
				startNewParagraphElements.includes(el.tagName) &&
				currentParagraph.length > 0
			) {
				paragraphs.push(currentParagraph);
				currentParagraph = '';
			}
			for (const ch of Array.from(el?.childNodes ?? []).reverse()) {
				stack.push(ch);
			}
		}
	}

	if (currentParagraph.length > 0) paragraphs.push(currentParagraph);

	return `<p>${paragraphs.join('</p>\n<p>')}</p>`;
}

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
		console.log(parsed.html);
		const text = parsed.html ? traverse(htmlParse(parsed.html)) : '';

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
