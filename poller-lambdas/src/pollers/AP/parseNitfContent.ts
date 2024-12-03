import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export type XmlNode = string | { [tag: string]: XmlNode } | XmlNode[];

function extractNodeFromArrayOfNodesByKey(arr: XmlNode, key: string): XmlNode {
	if (!Array.isArray(arr)) {
		throw new Error(`Node is not an array.`);
	}
	const maybeObject = arr.find(
		(node) => typeof node === 'object' && !Array.isArray(node) && key in node,
	);
	if (maybeObject === undefined) {
		throw new Error(
			`Could not find object with key "${key}" in provided array. Top-level keys in the available objects are: ${arr.map((o) => Object.keys(o).join(', ')).join('; ')}`,
		);
	}
	// @ts-expect-error -- we've checked that maybeObject has the key we're interested in, but TS isn't picking it up
	return maybeObject[key] as XmlNode;
}

export function extractNodeFromArrayOfNodesByPath(
	arr: XmlNode,
	path: string[],
): XmlNode {
	let node = arr;
	for (const key of path) {
		node = extractNodeFromArrayOfNodesByKey(node, key);
	}
	return node;
}

const parser = new XMLParser({
	preserveOrder: true,
	processEntities: true,
	htmlEntities: true,
});
const builder = new XMLBuilder({
	preserveOrder: true,
	processEntities: true,
	// format: true // useful for debugging
});

export function parseNitfContent(content: string) {
	const jObj = parser.parse(content) as unknown as XmlNode;

	const nitfContent = extractNodeFromArrayOfNodesByKey(jObj, 'nitf');

	const body = extractNodeFromArrayOfNodesByKey(nitfContent, 'body');

	const headline = extractNodeFromArrayOfNodesByPath(body, [
		'body.head',
		'hedline',
		'hl1',
		'#text',
	]) as string;

	const abstract = extractNodeFromArrayOfNodesByPath(body, [
		'body.head',
		'abstract',
		'#text',
	]) as string;
	const bodyContent = extractNodeFromArrayOfNodesByKey(body, 'body.content');
	const maybeBlock = extractNodeFromArrayOfNodesByKey(bodyContent, 'block');

	const bodyContentTags = builder.build(nitfToHtml(maybeBlock)) as string;

	return { headline, abstract, bodyContentTags };
}
export function nitfToHtml(nitfBlock: XmlNode): XmlNode {
	if (typeof nitfBlock === 'string') {
		return nitfBlock;
	}
	if (Array.isArray(nitfBlock)) {
		return nitfBlock.map((node) => nitfToHtml(node));
	}
	return Object.fromEntries(
		Object.entries(nitfBlock).map(([tag, node]) => {
			const remappedNode = nitfToHtml(node);
			switch (tag) {
				case 'hl2':
					return ['h2', remappedNode];
				default:
					return [tag, remappedNode];
			}
		}),
	);
}
