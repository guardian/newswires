import { getErrorMessage } from '@guardian/libs';
import { encode as encodeHtmlEntities } from 'html-entities';
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

type ParagraphReductionAccumulator = {
	currentParagraph: string[];
	allParagraphs: string[];
};
function paragraphReducer(
	acc: ParagraphReductionAccumulator,
	line: string,
	i: number,
	allLines: string[],
): ParagraphReductionAccumulator {
	if (line.length === 0) {
		return acc;
	}

	const nextAcc = { ...acc, currentParagraph: [...acc.currentParagraph, line] };

	const nextLine = allLines[i + 1];
	const firstWordNextLine = nextLine?.split(/\s/)[0];
	if (firstWordNextLine !== undefined) {
		const isOverrun = line.length + 1 + firstWordNextLine.length > 75;
		if (!isOverrun) {
			// end this paragraph
			const endParaAcc = {
				currentParagraph: [],
				allParagraphs: [
					...acc.allParagraphs,
					nextAcc.currentParagraph.join(' '),
				],
			};
			return endParaAcc;
		}
	}
	if (nextLine === undefined) {
		// reached end of text, make sure to finish this current paragraph
		return {
			currentParagraph: [],
			allParagraphs: [...acc.allParagraphs, nextAcc.currentParagraph.join(' ')],
		};
	}

	return nextAcc;
}

export function createParagraphsFromEmailTextBody(raw: string) {
	return raw
		.split('\n')
		.reduce(paragraphReducer, {
			currentParagraph: [],
			allParagraphs: [],
		})
		.allParagraphs.map((para) => `<p>${encodeHtmlEntities(para)}</p>`)
		.join('\n');
}

const startNewParagraphElements = ['BR', 'DIV', 'BLOCKQUOTE', 'LI', 'P'];

export function createParagraphsFromEmailHtmlBody(root: Node) {
	// Traverse the HTML tree in a depth-first order.
	// When we encounter a text node, append its contents into the
	// "current paragraph". When we enter an HTML element in
	// the `startNewParagraphElements` list above, end the "current
	// paragraph", store it in the list of seen paragraphs and
	// start a new one. Finally wrap all the seen paragraphs into
	// consecutive <p> elements.
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
			// Since the stack is last-in first-out, need to push children
			// onto the stack in _reverse_ to traverse the tree in order.
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
		// An email will usually have two bodies - an HTML and plain text version
		// of the same body. But sometimes it will be one or the other, so we
		// need to be able to attempt to create paragraphs from either!
		// It's very annoying!!!!!
		// TODO Come up an alternative feature which meets the same need for
		// contributors to submit copy, without having to integrate with email!!
		const parsed = await simpleParser(rawEmail);
		const text = parsed.html
			? createParagraphsFromEmailHtmlBody(htmlParse(parsed.html))
			: parsed.text
				? createParagraphsFromEmailTextBody(parsed.text)
				: "(No copy found in body of email - if that doesn't seem right then please report to Central Production / developers)";

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
