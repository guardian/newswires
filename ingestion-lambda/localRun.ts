import type { SQSRecord } from 'aws-lambda';
import { createDummyFeedEntry } from 'newswires-shared/localRun/exampleFeed';
import { fileService } from 'newswires-shared/s3';
import { main } from './src/handler';

const createRandomDocsAndInsertToInMemoryStore = () => {
	return Promise.all(
		Array(10)
			.fill(0)
			.map(async (_) => {
				const { body, externalId } = createDummyFeedEntry();
				await fileService.putObject({
					bucketName: '',
					key: externalId,
					body: JSON.stringify(body),
				});
				return createSQSRecord({ externalId });
			}),
	);
};

run().catch((e) => console.error(e));

async function run() {
	let i = 0;
	while (i < 1000) {
		const records = await createRandomDocsAndInsertToInMemoryStore();
		const event = {
			Records: records,
		};
		const response = await main(event);
		if (response && response.batchItemFailures.length > 0) {
			console.error(
				`Error running locally. Make sure you have a local database running by executing: ./scripts/setup-local-db.sh`,
			);
		}
		await delay(5000);
		i += 1;
	}
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const createSQSRecord = ({ externalId }: { externalId: string }): SQSRecord => {
	const randomSqsMessageId = Math.random().toString(36).substring(7);
	const recordThatShouldSucceed: SQSRecord = {
		messageId: randomSqsMessageId,
		body: JSON.stringify({ externalId, objectKey: externalId }),
		messageAttributes:  {},
	} as unknown as SQSRecord;
	return recordThatShouldSucceed;
};
