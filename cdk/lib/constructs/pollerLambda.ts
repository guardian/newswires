import { aws_sqs, Duration } from 'aws-cdk-lib';
import { GuLambdaFunction } from '@guardian/cdk/lib/constructs/lambda';
import { GuStack } from '@guardian/cdk/lib/constructs/core';
import { LAMBDA_ARCHITECTURE, LAMBDA_RUNTIME } from '../constants';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import {
	POLLER_LAMBDA_ENV_VAR_KEYS,
	PollerConfig,
} from '../../../shared/pollers';
import { RecursiveLoop } from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export const POLLER_LAMBDA_APP_SUFFIX = '_poller_lambda';

interface PollerLambdaProps {
	pollerId: string;
	pollerConfig: PollerConfig;
	ingestionLambdaQueue: aws_sqs.Queue;
}

export class PollerLambda {
	constructor(
		scope: GuStack,
		{ pollerId, ingestionLambdaQueue, pollerConfig }: PollerLambdaProps,
	) {
		const lambdaAppName = `${pollerId}${POLLER_LAMBDA_APP_SUFFIX}`;

		const secret = new Secret(scope, `${pollerId}Secret`, {
			secretName: `/${scope.stage}/${scope.stack}/newswires/${lambdaAppName}`,
			description: `Secret for the ${pollerId} poller lambda`,
		});

		const timeout = Duration.seconds(
			pollerConfig.overrideLambdaTimeoutSeconds || 60, // TODO consider also taking into account the 'idealFrequencyInSeconds' if specified
		);

		// we use queue here to allow lambda to call itself, but sometimes with a delay
		const lambdaQueue = new aws_sqs.Queue(scope, `${pollerId}LambdaQueue`, {
			queueName: `${scope.stack}-${scope.stage}-${lambdaAppName}_queue`,
			visibilityTimeout: timeout, // must be at least the same as the lambda
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
			memorySize: pollerConfig.overrideLambdaMemoryMB || 128,
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
