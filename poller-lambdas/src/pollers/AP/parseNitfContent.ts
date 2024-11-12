import { XMLBuilder, XMLParser } from 'fast-xml-parser';

interface NitfXml {
	xml?: string;
	nitf?: {
		body?: {
			'body.head'?: {
				abstract?: string;
			};
			'body.content'?: {
				block?: Array<Record<string, string>>;
			};
		};
	};
}

const parser = new XMLParser();
const builder = new XMLBuilder();

export function parseNitfContent(content: string) {
	const jObj = parser.parse(content) as unknown as NitfXml;

	const body = jObj.nitf?.body;

	if (!body) {
		console.table(jObj);
		throw new Error(`No body found in NITF`);
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
export function nitfToHtml(
	nitf: Record<string, string>,
): Record<string, string> {
	const remappedTags = Object.fromEntries(
		Object.entries(nitf).map(([key, value]) => {
			switch (key) {
				case 'hl2':
					return ['h2', value];
				default:
					return [key, value];
			}
		}),
	);
	return remappedTags;
}
