import type { HTMLElement } from 'node-html-parser';
import { parse } from 'node-html-parser';

export type ContentFromNitf = {
	bodyContentHtml?: string;
	issueDate?: string;
	byline?: string;
	headline?: string;
	abstract?: string;
	edMessage?: string;
};

export function nitfBlockToHtml(block: HTMLElement): string {
	const clonedBlock = block.clone() as HTMLElement;
	for (const hl2 of clonedBlock.querySelectorAll('hl2')) {
		hl2.tagName = 'h2';
	}
	for (const mediaTag of clonedBlock.querySelectorAll(
		'media,media-reference',
	)) {
		mediaTag.remove();
	}
	return clonedBlock.innerHTML
		.split('\n')
		.map((_) => _.trim())
		.join('');
}

export function parseNitfContent(content: string): ContentFromNitf {
	const root = parse(content);
	const issueDate = root.querySelector('date\\.issue')?.getAttribute('norm');
	const byline = root.querySelector('byline')?.textContent;
	const headline = root.querySelector('hl1#headline')?.textContent;
	const abstract = root.querySelector('abstract')?.textContent;
	const edMessage = root.querySelector('ed-msg[info]')?.getAttribute('info');

	const bodyContentBlockElements = Array.from(
		root.querySelectorAll('body\\.content block'),
	);

	const bodyContentHtml =
		bodyContentBlockElements.length > 0
			? bodyContentBlockElements
					.flatMap((block) => nitfBlockToHtml(block))
					.join('')
			: undefined;

	return { bodyContentHtml, issueDate, byline, headline, abstract, edMessage };
}
