import {
	GetSecretValueCommand,
	PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import type { SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import {
	POLLER_FAILURE_EVENT_TYPE,
	POLLER_INVOCATION_EVENT_TYPE,
} from '../../shared/constants';
import { getErrorMessage } from '../../shared/getErrorMessage';
import { createLogger } from '../../shared/lambda-logging';
import type { PollerId } from '../../shared/pollers';
import { POLLER_LAMBDA_ENV_VAR_KEYS } from '../../shared/pollers';
import { sqs } from '../../shared/sqs';
import { queueNextInvocation, secretsManager } from './aws';
import { getEnvironmentVariableOrCrash } from './config';
import { apPoller } from './pollers/ap/apPoller';
import { reutersPoller } from './pollers/reuters/reutersPoller';
import type { HandlerInputSqsPayload, PollFunction } from './types';
import { isFixedFrequencyPollOutput } from './types';

const pollerWrapper =
	(pollerFunction: PollFunction) =>
	async ({ Records }: HandlerInputSqsPayload) => {
		const logger = createLogger({
			sqsMessageId: Records.map((record) => record.messageId).join(', '),
		});
		logger.log({
			message: `Poller lambda invoked with SQS message id: ${Records.map((record) => record.messageId).join(', ')}`,
			eventType: POLLER_INVOCATION_EVENT_TYPE,
		});
		const startTimeEpochMillis = Date.now();
		const secretName = getEnvironmentVariableOrCrash(
			POLLER_LAMBDA_ENV_VAR_KEYS.SECRET_NAME,
		);
		const secret = await secretsManager
			.send(
				new GetSecretValueCommand({
					SecretId: secretName,
				}),
			)
			.then((_) => _.SecretString);
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
			await pollerFunction({ secret, input: valueFromPreviousPoll, logger })
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
							logger.error({
								message: `Sending to queue failed for ${externalId}`,
								error: getErrorMessage(error),
								queueMessage: JSON.stringify(message),
							});
							throw error; // we still expect this to be terminal for the poller lambda
						});
					}

					if (isFixedFrequencyPollOutput(output)) {
						const safeIdealFrequencyInSeconds = Math.max(
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

					if (output.newSecretValue) {
						// set new value in secrets manager
						console.log(`Updating secret value for ${secretName}`);
						await secretsManager.send(
							new PutSecretValueCommand({
								SecretId: secretName,
								SecretString: output.newSecretValue,
							}),
						);
					}
				})
				.catch((error) => {
					logger.error({
						message: `Poller lambda failed with message: ${getErrorMessage(error)}`,
						sqsMessageId: Records.map((record) => record.messageId).join(', '),
						eventType: POLLER_FAILURE_EVENT_TYPE,
						pollerName: pollerFunction.name,
					});
					// consider still queuing next (perhaps with default delay or 1min) to avoid the lambda from stopping entirely
					throw error;
				});
		}
	};

export const handlers = {
	// EXAMPLE_long_polling: pollerWrapper(EXAMPLE_long_polling),
	// EXAMPLE_fixed_frequency: pollerWrapper(EXAMPLE_fixed_frequency),
	reuters: pollerWrapper(reutersPoller),
	apPoller: pollerWrapper(apPoller),
} satisfies Record<
	PollerId,
	(sqsEvent: HandlerInputSqsPayload) => Promise<void>
>;
