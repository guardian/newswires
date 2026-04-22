
import { SQSRecord } from 'aws-lambda';
import { main } from './src/handler';
import { createDummyFeedEntry } from 'newswires-shared/localRun/exampleFeed';
import { fileService } from 'newswires-shared/s3';

const { body, externalId } = createDummyFeedEntry();
fileService.putToS3('', externalId, JSON.stringify(body))

run();

async function run() {
	const event = {
		Records: [createSQSRecord({ externalId})]
	}
	const response = await main(event)
	if(response && response.batchItemFailures.length > 0) {
		console.error(`Error running locally. Make sure you have a local database running by executing: ./scripts/setup-local-db.sh`)
	}
}

function createSQSRecord({externalId}: {externalId: string}): SQSRecord {
	const randomSqsMessageId = Math.random().toString(36).substring(7);
	const recordThatShouldSucceed: SQSRecord = {
		messageId: randomSqsMessageId,
		body: JSON.stringify({ externalId, objectKey: externalId}),
		messageAttributes:  {},
	} as unknown as SQSRecord;
	return recordThatShouldSucceed;
}
