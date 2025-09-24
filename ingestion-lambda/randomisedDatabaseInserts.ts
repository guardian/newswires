import { IngestorInputBody } from "../shared/types";
import { LoremIpsum } from 'lorem-ipsum';
import { processFingerpostJsonContent } from "./src/processContentObject";
import { createLogger } from "../shared/lambda-logging";
import { initialiseDbConnection } from "../shared/rds";
import { putItemToDb } from "./src/db";

const lorem = new LoremIpsum({});

const loremHtml = new LoremIpsum({}, 'html');

function createDummyFeedEntry(): {
	externalId: string;
	body: IngestorInputBody;
} {
	const usn = Math.random().toString(36).substring(7);
	const firstVersion = new Date().toISOString();
	const versionCreated = new Date().toISOString();
	const dateTimeSent = new Date().toISOString();

	const externalId = `APBIZWIR/${usn}/${dateTimeSent}/0`;

	const keywords = new Array(Math.floor(Math.random() * 5) + 2) // 2-7 keywords
		.fill(0)
		.map(() => lorem.generateWords(Math.floor(Math.random() * 3) + 1)); // 1-3 words per keyword

	return {
		externalId: externalId,
		body: {
			uri: `http://${externalId}`,
			'source-feed': 'APBIZWIR',
			usn,
			version: '0',
			type: 'text',
			format: 'GOA-WIRES-NINJS',
			mimeType: 'application/ninjs+json',
			firstVersion,
			versionCreated,
			dateTimeSent,
			originalUrn: '9615291038252416',
			slug: 'CT-NISSAN',
			headline: lorem.generateWords(Math.floor(Math.random() * 5) + 3),
			subhead: lorem.generateWords(Math.floor(Math.random() * 10) + 7),
			byline: '',
			priority: '4',
			subjects: {
				code: ['iptc:a', 'iptc:b', 'service:AP'],
			},
			mediaCatCodes: 'f',
			keywords,
			organisation: {
				// @ts-expect-error -- FIXME zod issue
				symbols: '',
			},
			tabVtxt: 'X',
			language: 'en',
			ednote: '',
			copyrightHolder: 'Business Wire',
			usage:
				'Copyright Business Wire 2024. This content is intended for editorial use only. For other uses, additional clearances may be required.',
			location: 'LAKEVILLE, Conn.',
			abstract: '',
			body_text: loremHtml.generateParagraphs(
				Math.floor(Math.random() * 4) + 1,
			),
		},
	};
}
async function main() {

    setInterval(async() => { 
        const content = createDummyFeedEntry();

        const processedMessage = processFingerpostJsonContent(JSON.stringify(content.body))
        if (processedMessage.status === 'failure') {
            console.error(`Failed to process generated message: ${processedMessage.reason}`);
            return;
        }   
        const logger = createLogger({});
        const { sql, closeDbConnection } = await initialiseDbConnection();


        const dbResult = await putItemToDb({
                                processedObject: processedMessage,
                                externalId: content.externalId,
                                s3Key: content.externalId,
                                sql,
                                logger,
                            });
        console.log(dbResult)  
        await closeDbConnection()
    }, 5000);                 
}
main().catch(console.error);