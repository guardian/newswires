import type { GuStack } from '@guardian/cdk/lib/constructs/core';
import { GuLambdaFunction } from '@guardian/cdk/lib/constructs/lambda';
import { aws_sqs, Duration } from 'aws-cdk-lib';
import { RecursiveLoop } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { PollerConfig, PollerId } from '../../../shared/pollers';
import {
	getPollerSecretName,
	POLLER_LAMBDA_ENV_VAR_KEYS,
	pollerIdToLambdaAppName,
} from '../../../shared/pollers';
import { LAMBDA_ARCHITECTURE, LAMBDA_RUNTIME } from '../constants';

interface PollerLambdaProps {
	pollerId: PollerId;
	pollerConfig: PollerConfig;
	ingestionLambdaQueue: aws_sqs.Queue;
}

export class PollerLambda {
	constructor(
		scope: GuStack,
		{ pollerId, ingestionLambdaQueue, pollerConfig }: PollerLambdaProps,
	) {
		const lambdaAppName = pollerIdToLambdaAppName(pollerId);

		const secret = new Secret(scope, `${pollerId}Secret`, {
			secretName: getPollerSecretName(scope.stage, pollerId),
			description: `Secret for the ${pollerId} poller lambda`,
		});

		const timeout = Duration.seconds(
			pollerConfig.overrideLambdaTimeoutSeconds ?? 60, // TODO consider also taking into account the 'idealFrequencyInSeconds' if specified
		);

		// we use queue here to allow lambda to call itself, but sometimes with a delay
		const lambdaQueue = new aws_sqs.Queue(scope, `${pollerId}LambdaQueue`, {
			queueName: `${scope.stack}-${scope.stage}-${lambdaAppName}_queue.fifo`,
			visibilityTimeout: timeout, // must be at least the same as the lambda
			fifo: true,
			retentionPeriod: Duration.minutes(5),
			// TODO dead letter queue
			// TODO consider setting retry count to zero
		});

		const lambda = new GuLambdaFunction(scope, `${pollerId}Lambda`, {
			app: lambdaAppName, // varying app tag for each lambda allows riff-raff to find by tag
			functionName: `${scope.stack}-${scope.stage}-${lambdaAppName}`,
			runtime: LAMBDA_RUNTIME,
			architecture: LAMBDA_ARCHITECTURE,
			recursiveLoop: RecursiveLoop.ALLOW, // this allows the lambda to indirectly call itself via the SQS queue
			reservedConcurrentExecutions: 1,
			environment: {
				[POLLER_LAMBDA_ENV_VAR_KEYS.INGESTION_LAMBDA_QUEUE_URL]:
					ingestionLambdaQueue.queueUrl,
				[POLLER_LAMBDA_ENV_VAR_KEYS.OWN_QUEUE_URL]: lambdaQueue.queueUrl,
				[POLLER_LAMBDA_ENV_VAR_KEYS.SECRET_NAME]: secret.secretName,
			},
			memorySize: pollerConfig.overrideLambdaMemoryMB ?? 128,
			timeout,
			handler: `index.${pollerId}`, // see programmatically generated exports in poller-lambdas/src/index.ts
			fileName: `poller-lambdas.zip`, // shared zip for all the poller-lambdas
		});

		secret.grantRead(lambda);

		// wire up lambda to process its own queue
		lambda.addEventSource(new SqsEventSource(lambdaQueue, { batchSize: 1 }));

		// give permission to lambda to write back to its own queue (to facilitate recursive calling)
		lambdaQueue.grantSendMessages(lambda);

		// allow lambda to write to the ingestion-lambdas queue
		ingestionLambdaQueue.grantSendMessages(lambda); //TODO consider making that queue a destination for the poller-lambda and then the lambda just returns the payload (on success and failure) rather than using SQS SDK within the lambda

		// TODO alarms for too frequent and stalled
	}
}
