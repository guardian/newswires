import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import {
	SendMessageCommand,
	SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import type { PollerId } from '../../shared/pollers';
import { POLLER_LAMBDA_ENV_VAR_KEYS } from '../../shared/pollers';
import { queueNextInvocation, secretsManager, sqs } from './aws';
import { getEnvironmentVariableOrCrash } from './config';
import { EXAMPLE_fixed_frequency } from './pollers/EXAMPLE_fixed_frequency';
import { EXAMPLE_long_polling } from './pollers/EXAMPLE_long_polling';
import type { HandlerInputSqsPayload, PollFunction } from './types';
import { isFixedFrequencyPollOutput } from './types';

const pollerWrapper =
	(pollerFunction: PollFunction) =>
	async ({ Records }: HandlerInputSqsPayload) => {
		const startTimeEpochMillis = Date.now();
		const secret = await secretsManager
			.send(
				new GetSecretValueCommand({
					SecretId: getEnvironmentVariableOrCrash(
						POLLER_LAMBDA_ENV_VAR_KEYS.SECRET_NAME,
					),
				}),
			)
			.then((_) => _.SecretString!);
		if (!secret) {
			throw new Error(
				`Secret not found at: ${POLLER_LAMBDA_ENV_VAR_KEYS.SECRET_NAME}`,
			);
		}
		if (Records.length != 1) {
			console.warn('Expected exactly one SQS record, but got', Records.length);
		}
		for (const record of Records) {
			const valueFromPreviousPoll = record.body;
			await pollerFunction(secret, valueFromPreviousPoll)
				.then(async (output) => {
					const endTimeEpochMillis = Date.now();

					const messagesForIngestionLambda = Array.isArray(
						output.payloadForIngestionLambda,
					)
						? output.payloadForIngestionLambda
						: [output.payloadForIngestionLambda];

					for (const { externalId, body } of messagesForIngestionLambda) {
						console.log(
							`Sending message to ingestion lambda with id: ${externalId}.`,
						);
						const message: SendMessageCommandInput = {
							QueueUrl: getEnvironmentVariableOrCrash(
								POLLER_LAMBDA_ENV_VAR_KEYS.INGESTION_LAMBDA_QUEUE_URL,
							),
							MessageBody: JSON.stringify(body),
							MessageAttributes: {
								'Message-Id': {
									StringValue: externalId,
									DataType: 'String',
								},
							},
						};
						await sqs.send(new SendMessageCommand(message)).catch((error) => {
							console.error(
								`sending to queue failed for ${externalId}`,
								message,
								error,
							);
							throw error; // we still expect this to be terminal for the poller lambda
						});
					}

					if (isFixedFrequencyPollOutput(output)) {
						const safeIdealFrequencyInSeconds = Math.min(
							5,
							output.idealFrequencyInSeconds,
						);
						const remainingMillisBeforeNextInterval =
							safeIdealFrequencyInSeconds * 1000 -
							(endTimeEpochMillis - startTimeEpochMillis);
						const delayInSeconds = Math.max(
							remainingMillisBeforeNextInterval / 1000,
							0,
						);
						await queueNextInvocation({
							DelaySeconds: delayInSeconds,
							MessageBody: output.valueForNextPoll,
						});
					} else {
						await queueNextInvocation({
							MessageBody: output.valueForNextPoll,
						});
					}
				})
				.catch((error) => {
					console.error('FAILED', error);
					// consider still queuing next (perhaps with default delay or 1min) to avoid the lambda from stopping entirely
					throw error;
				});
		}
	};

export = {
	EXAMPLE_long_polling: pollerWrapper(EXAMPLE_long_polling),
	EXAMPLE_fixed_frequency: pollerWrapper(EXAMPLE_fixed_frequency),
} satisfies Record<
	PollerId,
	(sqsEvent: HandlerInputSqsPayload) => Promise<void>
>;
