import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { main } from './src/handler';
import { createDummyFeedEntry } from 'newswires-shared/localRun/exampleFeed';

recursivelyScheduleEvent();

function recursivelyScheduleEvent() {
	setTimeout(
		() => {
			const dummyEvent = createDummySQSEvent()
			main(dummyEvent).then(console.log).catch(console.error);
			recursivelyScheduleEvent();
		},
		3000 + Math.floor(Math.random() * 5000),
	);
}

function createDummySQSEvent() {
	const randomSqsMessageId = Math.random().toString(36).substring(7);
	const { body, externalId } = createDummyFeedEntry();

	const recordThatShouldSucceed: SQSRecord = {
		messageId: randomSqsMessageId,
		body: JSON.stringify(body),
		messageAttributes: {
			'Message-Id': { stringValue: externalId, dataType: 'String' },
		},
	} as unknown as SQSRecord;

	const dummyEvent: SQSEvent = {
		Records: [recordThatShouldSucceed],
	};
	return dummyEvent
}

export function localRunFingerpostQueueingLambda() {
	const dummyEvent = createDummySQSEvent()
	main(dummyEvent).then(console.log).catch(console.error);
}


