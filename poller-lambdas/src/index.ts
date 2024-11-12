import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import type { SQSEvent } from 'aws-lambda';
import type { PollerId } from '../../shared/pollers';
import { POLLER_LAMBDA_ENV_VAR_KEYS } from '../../shared/pollers';
import { EXAMPLE_fixed_frequency } from './pollers/EXAMPLE_fixed_frequency';
import { EXAMPLE_long_polling } from './pollers/EXAMPLE_long_polling';
import type { PollFunction } from './types';

const getEnvironmentVariableOrCrash = (
	key: keyof typeof POLLER_LAMBDA_ENV_VAR_KEYS,
) => process.env[key]!;

const sqs = new SQSClient({});
const lambdaApp = process.env['App'];
const ownQueueUrl = getEnvironmentVariableOrCrash(
	POLLER_LAMBDA_ENV_VAR_KEYS.OWN_QUEUE_URL,
);

const queueNextInvocation = (props: {
	MessageBody: string;
	DelaySeconds?: number;
}) =>
	sqs.send(
		new SendMessageCommand({
			QueueUrl: ownQueueUrl,
			MessageDeduplicationId: lambdaApp, // should prevent the same lambda from being invoked multiple times
			...props,
		}),
	);

const pollerWrapper =
	(pollerFunction: PollFunction) =>
	async ({ Records }: SQSEvent) => {
		const startTimeEpochMillis = Date.now();
		const secret = 'TODO'; //TODO get secret (using name from env var)
		if (Records.length != 1) {
			console.warn('Expected exactly one SQS record, but got', Records.length);
		}
		return Promise.all(
			Records.map((record) => {
				const valueFromPreviousPoll = record.body; //TODO maybe parse
				return pollerFunction(secret, valueFromPreviousPoll)
					.then(async (output) => {
						const endTimeEpochMillis = Date.now();

						await sqs.send(
							new SendMessageCommand({
								//TODO consider deduplication ID based on the unique story id from the agency??
								QueueUrl: getEnvironmentVariableOrCrash(
									POLLER_LAMBDA_ENV_VAR_KEYS.INGESTION_LAMBDA_QUEUE_URL,
								),
								MessageBody: JSON.stringify(output.payloadForIngestionLambda),
							}),
						); // TODO wrap in try catch

						//TODO guard against too frequent polling
						if ('valueForNextPoll' in output) {
							await queueNextInvocation({
								MessageBody: output.valueForNextPoll,
							});
						} else {
							const remainingMillisBeforeNextInterval =
								output.idealFrequencyInSeconds * 1000 -
								(endTimeEpochMillis - startTimeEpochMillis);
							const delayInSeconds = Math.max(
								remainingMillisBeforeNextInterval / 1000,
								0,
							);
							await queueNextInvocation({
								DelaySeconds: delayInSeconds,
								MessageBody: new Date().toISOString(), // MessageBody needs to be non-empty, see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessage.html#SQS-SendMessage-request-MessageBody
							});
						}
					})
					.catch((error) => {
						console.error(error);
						// TODO send message (perhaps with default delay or 1min) to avoid the lambda from stopping entirely
						throw error;
					});
			}),
		);
	};

export = {
	EXAMPLE_long_polling: pollerWrapper(EXAMPLE_long_polling),
	EXAMPLE_fixed_frequency: pollerWrapper(EXAMPLE_fixed_frequency),
} satisfies Record<PollerId, (sqsEvent: SQSEvent) => Promise<void[]>>;
