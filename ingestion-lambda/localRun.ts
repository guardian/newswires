
import { SQSRecord } from 'aws-lambda';
import { main } from './src/handler';
import { createDummyFeedEntry } from 'newswires-shared/localRun/exampleFeed';
import { fileService } from 'newswires-shared/s3';

run();

async function run() {
	setInterval(async () => {
		const event = {
			Records: createRandomDocsAndInsertToInMemoryStore()
		}
		const response = await main(event)
		if(response && response.batchItemFailures.length > 0) {
			console.error(`Error running locally. Make sure you have a local database running by executing: ./scripts/setup-local-db.sh`)
		}
	}, 5000)
}
const createRandomDocsAndInsertToInMemoryStore = () => {
	return [...Array(10).fill(0)].map(_ => {
		const { body, externalId } = createDummyFeedEntry();
		fileService.putToS3({bucketName: '', key: externalId, body: JSON.stringify(body)})
		return createSQSRecord({externalId})
	})
}
const createSQSRecord = ({externalId}: {externalId: string}): SQSRecord => {
	const randomSqsMessageId = Math.random().toString(36).substring(7);
	const recordThatShouldSucceed: SQSRecord = {
		messageId: randomSqsMessageId,
		body: JSON.stringify({ externalId, objectKey: externalId}),
		messageAttributes:  {},
	} as unknown as SQSRecord;
	return recordThatShouldSucceed;
}
