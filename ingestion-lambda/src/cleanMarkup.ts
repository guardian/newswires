import type { Node } from 'node-html-parser';
import { HTMLElement, parse, TextNode } from 'node-html-parser';
import type { Logger } from '../../shared/lambda-logging';
import { createLogger } from '../../shared/lambda-logging';

export function cleanBodyTextMarkup(bodyText: string, logger: Logger = createLogger({})): string {
	const root = parse(bodyText);
	const originalInnerText = root.innerText; // flattenBlocks mutates the root, so we need to save the original innerText
	const wrapper = new HTMLElement('div', {});
	flattenBlocks(root).forEach((block) => {
		wrapper.appendChild(block);
	});
	if (originalInnerText.replaceAll(/\s/g, '') !== wrapper.innerText.replaceAll(/\s/g, '')) {
		logger.warn({message: 'Warning: bodyText markup was not cleaned correctly, reverting to original markup', originalInnerText, newInnerText: wrapper.innerText});
		return bodyText;
	}
	return wrapper.innerHTML;
}

function flattenBlocks(block: Node): Node[] {
	if (block.childNodes.length === 0) {
		if (block instanceof TextNode && block.textContent.trim().length === 0) {
			return [];
		}
		const newP = new HTMLElement('p', {});
		newP.appendChild(block);
		return [newP];
	}

	const paragraphs: Node[] = [];
	let currentPara: HTMLElement = new HTMLElement('p', {});

	function appendCurrentParaToParagraphs() {
		if (currentPara.innerHTML.trim().length > 0) {
			paragraphs.push(currentPara);
			currentPara = new HTMLElement('p', {});
		}
	}

	for (const b of block.childNodes) {
		const tagName = b instanceof HTMLElement ? b.tagName : undefined;

		switch (tagName) {
			case 'P':
				appendCurrentParaToParagraphs();
				paragraphs.push(...flattenBlocks(b));
				break;
			case 'DIV':
			case 'SECTION':
			case 'HEADER':
			case 'FOOTER':
			case 'ASIDE':
			case 'ARTICLE':
				(() => {
					const clonedWrapper = b.clone() as HTMLElement;
					clonedWrapper.innerHTML = '';
					flattenBlocks(b).forEach((block) => {
						clonedWrapper.appendChild(block);
					});
					appendCurrentParaToParagraphs();
					paragraphs.push(clonedWrapper);
				})();
				break;
			case 'BR':
				appendCurrentParaToParagraphs(); // if there's a <br> with content either side of it then we want to split it into two paragraphs
				break;
			case 'UL':
			case 'DL':
			case 'OL':
			case 'TABLE':
				paragraphs.push(b);
				break;
			default:
				currentPara.appendChild(b);
				break;
		}
	}

	appendCurrentParaToParagraphs();
	return paragraphs;
}
