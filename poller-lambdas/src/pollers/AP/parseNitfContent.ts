import { XMLBuilder, XMLParser } from 'fast-xml-parser';

type XmlTag = Record<string, TextNode[]>;
interface TextNode {
	'#text': string;
}

function extractObjectWithKeyFromArrayOfObjects<
	T extends Record<string, unknown>,
>(array: T[], key: string): T | undefined {
	return array.find((obj) => key in obj);
}

/**
 * @todo this doesn't match anymore -- actually, the top level is an array of XmlTags, really, except that it
 */
type NitfXml = {
	nitf: [
		{
			body: {
				'body.head'?: {
					abstract?: string;
				};
				'body.content'?: {
					block?: XmlTag[][];
				};
			};
		},
	];
};

function isNitf(xml: unknown): xml is NitfXml {
	console.log('xml:', JSON.stringify(xml, null, 2));
	console.log(
		typeof xml === 'object' &&
			xml !== null &&
			'nitf' in xml &&
			typeof xml.nitf === 'object' &&
			xml.nitf !== null &&
			'body' in xml.nitf,
	);
	return (
		typeof xml === 'object' &&
		xml !== null &&
		'nitf' in xml &&
		typeof xml.nitf === 'object' &&
		xml.nitf !== null &&
		'body' in xml.nitf
	);
}

const parser = new XMLParser({ preserveOrder: true });
const builder = new XMLBuilder({ preserveOrder: true });

export function parseNitfContent(content: string) {
	const jObj = parser.parse(content) as unknown as unknown[];

	const nitfContent = extractObjectWithKeyFromArrayOfObjects<NitfXml>(
		jObj,
		'nitf',
	);

	const body = jObj.find(isNitf)?.nitf.body;

	if (!body) {
		console.table(jObj);

		throw new Error(`No body found in NITF XML`);
	}

	const abstract = body['body.head']?.['abstract'];
	const maybeBlock = body['body.content']?.block;

	if (!maybeBlock) {
		throw new Error(`No block found in NITF`);
	}
	const bodyContent = (Array.isArray(maybeBlock) ? maybeBlock : [maybeBlock])
		.map((block) => {
			const remappedTags = nitfToHtml(block);
			return builder.build(remappedTags) as string;
		})
		.join('');
	return { abstract, bodyContent };
}
export function nitfToHtml(nitfBlock: XmlTag[]): Array<[string, string]> {
	const remappedTags: Array<[string, string]> = nitfBlock.flatMap((tagRecord) =>
		Object.entries(tagRecord).map(([tag, textNodes]) => {
			const text: string = textNodes.map((node) => node['#text']).join('');
			switch (tag) {
				case 'hl2':
					return ['h2', text] as [string, string];
				case 'p':
					return ['p', text] as [string, string];
				default:
					return [tag, text] as [string, string];
			}
		}),
	);
	return remappedTags;
}
