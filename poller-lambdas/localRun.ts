import type { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import type { PollerId } from 'newswires-shared/pollers';
import {
	getPollerSecretName,
	POLLER_LAMBDA_ENV_VAR_KEYS,
	POLLERS_CONFIG,
} from 'newswires-shared/pollers';
import { fakeSQS } from 'newswires-shared/sqs';
import prompts from 'prompts';
import { handlers } from './src/index';
import type { HandlerInputSqsPayload } from './src/types';

const fakeInvoke = async (
	handler: (sqsEvent: HandlerInputSqsPayload) => Promise<void>,
	input: string,
	fakeQueues: Record<string, SendMessageCommand[]>,
	ownQueueUrl: string,
	ingestionQueueUrl: string,
) => {
	console.log('---------------------------------------------');
	console.log(`POLLER INVOCATION STARTED ${new Date().toISOString()}`);
	console.log('---------------------------------------------');

	await handler({
		Records: [
			{
				body: input,
				messageId: 'FAKE_MESSAGE_ID',
			},
		],
	});

	const ownQueue = fakeQueues[ownQueueUrl]!;
	const ingestionQueue = fakeQueues[ingestionQueueUrl]!;

	const nextQueueItem = ownQueue.shift()!.input;
	const inputForNext = nextQueueItem.MessageBody!;
	const maybeDelaySeconds = nextQueueItem.DelaySeconds;

	console.log('---------------------------------------------');
	console.log(`POLLER INVOCATION COMPLETED ${new Date().toISOString()}`);
	if (maybeDelaySeconds) {
		console.log(`  DelaySeconds: ${maybeDelaySeconds}`);
	}
	console.log(`  input for next invocation: ${inputForNext}`);
	while (ingestionQueue.length > 0) {
		const nextIngestionItem = ingestionQueue.shift()!.input;
		console.log(`  ITEM SENT TO INGESTION QUEUE:`, nextIngestionItem);
	}
	console.log('---------------------------------------------');

	const { nextAction } = (await prompts({
		type: 'select',
		name: 'nextAction',
		message: 'What next?',
		choices: [
			...(maybeDelaySeconds
				? [
						{
							title: `invoke after ${maybeDelaySeconds}s`,
							value() {
								console.log(
									`Waiting ${maybeDelaySeconds}s before invoking again...`,
								);
								setTimeout(
									() =>
										void fakeInvoke(
											handler,
											inputForNext,
											fakeQueues,
											ownQueueUrl,
											ingestionQueueUrl,
										),
									maybeDelaySeconds * 1000,
								);
							},
						},
					]
				: []),
			{
				title: 'Invoke again immediately',
				value() {
					void fakeInvoke(
						handler,
						inputForNext,
						fakeQueues,
						ownQueueUrl,
						ingestionQueueUrl,
					);
				},
			},
			{
				title: 'Exit',
				value() {
					process.exit(0);
				},
			},
		],
	})) as { nextAction: () => void };

	nextAction();
};

void (async () => {
	if (fakeSQS instanceof SQSClient) {
		throw Error(
			'SQS appears to be using a real client - this file should be using a FAKE local SQS client',
		);
	}
	const ownQueueUrl = 'FAKE_OWN_QUEUE_URL';
	process.env[POLLER_LAMBDA_ENV_VAR_KEYS.OWN_QUEUE_URL] = ownQueueUrl;

	const ingestionQueueUrl = 'FAKE_INGESTION_QUEUE_URL';
	process.env[POLLER_LAMBDA_ENV_VAR_KEYS.INGESTION_LAMBDA_QUEUE_URL] =
		ingestionQueueUrl;

	const { pollerId } = (await prompts({
		type: 'select',
		name: 'pollerId',
		message: 'Which poller?',
		choices: Object.keys(POLLERS_CONFIG).map((pollerId) => ({
			title: pollerId,
			value: pollerId,
		})),
	})) as { pollerId: PollerId };

	process.env[POLLER_LAMBDA_ENV_VAR_KEYS.SECRET_NAME] = getPollerSecretName(
		'CODE',
		pollerId,
	);

	const handler = handlers[pollerId];

	const { input } = (await prompts({
		type: 'text',
		name: 'input',
		message: 'Do you want to provide a starting input?',
	})) as { input: string };

	await fakeInvoke(
		handler,
		input,
		fakeSQS.queueData,
		ownQueueUrl,
		ingestionQueueUrl,
	);
})();
