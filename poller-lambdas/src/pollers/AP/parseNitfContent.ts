import type { HTMLElement } from 'node-html-parser';
import { parse } from 'node-html-parser';

export function nitfBlockToHtml(block: HTMLElement): string {
	const clonedBlock = block.clone() as HTMLElement;
	Array.from(clonedBlock.querySelectorAll('hl2')).forEach(
		(hl2) => (hl2.tagName = 'h2'),
	);
	Array.from(clonedBlock.querySelectorAll('media,media-reference')).forEach(
		(mediaTag) => mediaTag.remove(),
	);
	return clonedBlock.innerHTML
		.split('\n')
		.map((_) => _.trim())
		.join('');
}

export function parseNitfContent(content: string) {
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

// import { XMLBuilder, XMLParser } from 'fast-xml-parser';

// export type XmlNode = string | number | { [tag: string]: XmlNode } | XmlNode[];

// type RecordlikeXmlNode = Record<string, XmlNode>;

// function isRecordlikeXmlNode(node: XmlNode): node is RecordlikeXmlNode {
// 	return typeof node === 'object' && !Array.isArray(node);
// }

// function isAttributesXmlNode(
// 	node: XmlNode | undefined,
// ): node is Record<string, string> {
// 	if (node === undefined) {
// 		return false;
// 	}
// 	const keysAreStrings = Object.keys(node).every(
// 		(key) => typeof key === 'string',
// 	);
// 	const valuesAreStrings = Object.values(node).every(
// 		(value) => typeof value === 'string',
// 	);
// 	return keysAreStrings && valuesAreStrings;
// }

// function extractNodeContentFromArrayOfNodesByKey(
// 	arr: XmlNode,
// 	key: string,
// ): XmlNode {
// 	if (!Array.isArray(arr)) {
// 		throw new Error(`Node ${JSON.stringify(arr)} is not an array.`);
// 	}
// 	const maybeObject = arr.find(
// 		(node) => typeof node === 'object' && !Array.isArray(node) && key in node,
// 	);
// 	if (maybeObject === undefined || !isRecordlikeXmlNode(maybeObject)) {
// 		throw new Error(
// 			`Could not find object with key "${key}" in provided array. Top-level keys in the available objects are: ${arr.map((o) => Object.keys(o).join(', ')).join('; ')}`,
// 		);
// 	}

// 	const node = maybeObject[key] as XmlNode; // ts doesn't seem to catch that we've checked for the key already, so we're casting for now

// 	return node;
// }

// function findNodeInArrayOfNodesByKey(
// 	arr: XmlNode,
// 	key: string,
// ): RecordlikeXmlNode {
// 	if (!Array.isArray(arr)) {
// 		throw new Error(`Node ${JSON.stringify(arr)} is not an array.`);
// 	}
// 	const maybeObject = arr.find(
// 		(node) => typeof node === 'object' && !Array.isArray(node) && key in node,
// 	);
// 	if (maybeObject === undefined || !isRecordlikeXmlNode(maybeObject)) {
// 		throw new Error(
// 			`Could not find object with key "${key}" in provided array. Top-level keys in the available objects are: ${arr.map((o) => Object.keys(o).join(', ')).join('; ')}`,
// 		);
// 	}

// 	const node = maybeObject;

// 	return node;
// }

// export function extractNodeByPath(arr: XmlNode, path: string[]): XmlNode {
// 	let node = arr;
// 	for (const key of path) {
// 		const targetNode = findNodeInArrayOfNodesByKey(node, key);
// 		node = targetNode[key] as XmlNode;
// 	}
// 	return node;
// }

// function extractAttributesFromNodeByPath(
// 	node: XmlNode,
// 	path: string[],
// ): Record<string, string> {
// 	const [last, ...restReversed] = path.reverse();
// 	const parentNode = extractNodeByPath(node, restReversed.reverse());
// 	if (last === undefined) {
// 		return {};
// 	}

// 	const maybeAttributes = findNodeInArrayOfNodesByKey(parentNode, last)[':@'];

// 	return isAttributesXmlNode(maybeAttributes) ? maybeAttributes : {};
// }

// const parser = new XMLParser({
// 	preserveOrder: true,
// 	processEntities: true,
// 	htmlEntities: true,
// 	ignoreAttributes: false,
// });
// const builder = new XMLBuilder({
// 	preserveOrder: true,
// 	processEntities: true,
// 	// format: true // useful for debugging
// });

// export function parseNitfContent(content: string) {
// 	const jObj = parser.parse(content) as unknown as XmlNode;

// 	const nitfContent = extractNodeContentFromArrayOfNodesByKey(jObj, 'nitf');

// 	const head = extractNodeContentFromArrayOfNodesByKey(nitfContent, 'head');

// 	const body = extractNodeContentFromArrayOfNodesByKey(nitfContent, 'body');

// 	const headline = extractNodeByPath(body, [
// 		'body.head',
// 		'hedline',
// 		'hl1',
// 		'#text',
// 	]) as string;

// 	const abstract = extractNodeByPath(body, ['body.head', 'abstract', '#text']);

// 	const edMessage = extractAttributesFromNodeByPath(head, [
// 		'docdata',
// 		'ed-msg',
// 	])['@_info'];

// 	const bodyContent = extractNodeContentFromArrayOfNodesByKey(
// 		body,
// 		'body.content',
// 	);
// 	const maybeBlock = extractNodeContentFromArrayOfNodesByKey(
// 		bodyContent,
// 		'block',
// 	);

// 	const issueDate = extractAttributesFromNodeByPath(head, [
// 		'docdata',
// 		'date.issue',
// 	])['@_norm'];

// 	const classifierAttributes = extractAttributesFromNodeByPath(head, [
// 		'docdata',
// 		'identified-content',
// 		'classifier',
// 	]);

// 	const bodyContentTags = builder.build(nitfToHtml(maybeBlock)) as string;

// 	return {
// 		headline,
// 		abstract: abstract,
// 		bodyContentTags,
// 		edMessage,
// 		issueDate,
// 	};
// }

// export function nitfToHtml(nitfBlock: XmlNode): XmlNode {
// 	if (Array.isArray(nitfBlock)) {
// 		return nitfBlock.map((node) => nitfToHtml(node));
// 	}
// 	if (typeof nitfBlock === 'object') {
// 		return Object.fromEntries(
// 			Object.entries(nitfBlock).map(([tag, node]) => {
// 				const remappedNode = nitfToHtml(node);
// 				switch (tag) {
// 					case 'hl2':
// 						return ['h2', remappedNode];
// 					default:
// 						return [tag, remappedNode];
// 				}
// 			}),
// 		);
// 	}
// 	return nitfBlock; // expecting this to be a string or number
// }
