import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { main } from './src/handler';

const exampleDocs = [{
	externalId: '0004793a823c2dbe9b1f07c7494d1bca_0a1aza0c0',
	objectKey: '0004793a823c2dbe9b1f07c7494d1bca_0a1aza0c0.json',
}, {
	externalId: '0004793a823c2dbe9b1f07c7494d1bca_1a1aza0c0',
	objectKey: '0004793a823c2dbe9b1f07c7494d1bca_1a1aza0c0.json',
},
{
	externalId: '0004793a823c2dbe9b1f07c7494d1bca_2a1aza0c0',
	objectKey: '0004793a823c2dbe9b1f07c7494d1bca_2a1aza0c0.json',
},
{
	externalId: '0004793a823c2dbe9b1f07c7494d1bca_2a1aza0c0',
	objectKey: '0004793a823c2dbe9b1f07c7494d1bca_2a1aza0c0.json',
},
{
	externalId: '0007ba5855d65dd83ebf357b95f3185f_0a1aza0c0',
	objectKey: '0007ba5855d65dd83ebf357b95f3185f_0a1aza0c0.json',
},
{
	externalId: '000a9a3cdbc64616832787791196eeac_3a1aza0c0',
	objectKey: '000a9a3cdbc64616832787791196eeac_3a1aza0c0.json',
},
{
	externalId: '0019c974d9e01c9398cfda7ece55aa46_2a1aza0c0',
	objectKey: '0019c974d9e01c9398cfda7ece55aa46_2a1aza0c0.json',
}
]

run();

function run() {
	
	const dummyEvent: SQSEvent = {
		Records: exampleDocs.map((doc) => createSQSRecord(doc))
	};
	console.log(
		`Invoking ingestion lambda with dummy event: ${JSON.stringify(
			dummyEvent,
		)}`,
	);
	main(dummyEvent).then(console.log).catch(console.error);
}



function createSQSRecord(doc: {
	externalId: string;
	objectKey: string;
}) : SQSRecord {
	const randomSqsMessageId = Math.random().toString(36).substring(7);

	const recordThatShouldSucceed: SQSRecord = {
		messageId: randomSqsMessageId,
		body: JSON.stringify(doc),
		messageAttributes: {
			'Message-Id': { stringValue: doc.externalId, dataType: 'String' },
		},
	} as unknown as SQSRecord;
	return recordThatShouldSucceed;

}