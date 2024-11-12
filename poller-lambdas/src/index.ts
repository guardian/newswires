import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import type { SQSEvent } from 'aws-lambda';
import type { PollerId } from '../../shared/pollers';
import { POLLER_LAMBDA_ENV_VAR_KEYS } from '../../shared/pollers';
import { queueNextInvocation, secretsManager, sqs } from './aws';
import {
	getEnvironmentVariableOrCrash,
	ingestionLambdaQueueUrl,
} from './config';
import { EXAMPLE_fixed_frequency } from './pollers/EXAMPLE_fixed_frequency';
import { EXAMPLE_long_polling } from './pollers/EXAMPLE_long_polling';
import type { PollFunction } from './types';

const pollerWrapper =
	(pollerFunction: PollFunction) =>
	async ({ Records }: SQSEvent) => {
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
		return Promise.all(
			Records.map((record) => {
				const valueFromPreviousPoll = record.body; //TODO maybe parse
				return pollerFunction(secret, valueFromPreviousPoll)
					.then(async (output) => {
						const endTimeEpochMillis = Date.now();

						const messagesForIngestionLambda = Array.isArray(
							output.payloadForIngestionLambda,
						)
							? output.payloadForIngestionLambda
							: [output.payloadForIngestionLambda];

						await Promise.all(
							messagesForIngestionLambda.map(
								//TODO consider throttling / rate limiting
								async ({ externalId, body }) => {
									console.log(
										`Sending message to ingestion lambda with id: ${externalId}.`,
									);
									return await sqs.send(
										new SendMessageCommand({
											//TODO consider deduplication ID based on the unique story id from the agency??
											QueueUrl: ingestionLambdaQueueUrl,
											MessageBody: JSON.stringify(body),
											MessageAttributes: {
												'Message-Id': {
													StringValue: externalId,
													DataType: 'String',
												},
											},
										}),
									);
								}, // TODO wrap in try catch
							),
						);
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
