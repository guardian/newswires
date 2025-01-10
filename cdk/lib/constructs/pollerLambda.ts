import { GuAlarm } from '@guardian/cdk/lib/constructs/cloudwatch';
import type { GuStack } from '@guardian/cdk/lib/constructs/core';
import { GuLambdaFunction } from '@guardian/cdk/lib/constructs/lambda';
import { aws_sqs, Duration } from 'aws-cdk-lib';
import {
	ComparisonOperator,
	Metric,
	TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
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
	alarmSnsTopicName: string;
}

export class PollerLambda {
	constructor(
		scope: GuStack,
		{
			pollerId,
			ingestionLambdaQueue,
			pollerConfig,
			alarmSnsTopicName,
		}: PollerLambdaProps,
	) {
		const lambdaAppName = pollerIdToLambdaAppName(pollerId);

		const secret = new Secret(scope, `${pollerId}Secret`, {
			secretName: getPollerSecretName(scope.stage, pollerId),
			description: `Secret for the ${pollerId} poller lambda`,
		});

		const timeout = Duration.seconds(
			pollerConfig.overrideLambdaTimeoutSeconds ?? 60,
		);

		// we use queue here to allow lambda to call itself, but sometimes with a delay
		const lambdaQueue = new aws_sqs.Queue(scope, `${pollerId}LambdaQueue`, {
			queueName: `${scope.stack}-${scope.stage}-${lambdaAppName}_queue`,
			visibilityTimeout: timeout, // must be at least the same as the lambda
			retentionPeriod: Duration.minutes(5),
			// TODO dead letter queue
			// TODO consider setting retry count to zero
		});

		if (
			pollerConfig.idealFrequencyInSeconds &&
			pollerConfig.idealFrequencyInSeconds > Duration.minutes(15).toSeconds()
		) {
			throw Error(
				"SQS' max delay is 15mins, so if you really mean to poll so infrequently (e.g. hourly or daily), then you'll need to use Cloudwatch/EventBridge rules instead of SQS ",
			);
		}

		// only one lambda should be happening at once, however the lambda queues up its next execution whilst it's still running
		// so concurrency of 2 should prevent throttling, but also guard against it going haywire
		const reservedConcurrentExecutions = 2;

		const functionName = `${scope.stack}-${scope.stage}-${lambdaAppName}`;
		const lambda = new GuLambdaFunction(scope, `${pollerId}Lambda`, {
			app: lambdaAppName, // varying app tag for each lambda allows riff-raff to find by tag
			functionName,
			runtime: LAMBDA_RUNTIME,
			architecture: LAMBDA_ARCHITECTURE,
			recursiveLoop: RecursiveLoop.ALLOW, // this allows the lambda to indirectly call itself via the SQS queue
			reservedConcurrentExecutions,
			environment: {
				[POLLER_LAMBDA_ENV_VAR_KEYS.INGESTION_LAMBDA_QUEUE_URL]:
					ingestionLambdaQueue.queueUrl,
				[POLLER_LAMBDA_ENV_VAR_KEYS.OWN_QUEUE_URL]: lambdaQueue.queueUrl,
				[POLLER_LAMBDA_ENV_VAR_KEYS.SECRET_NAME]: secret.secretName,
			},
			throttlingMonitoring: {
				snsTopicName: alarmSnsTopicName,
				alarmDescription: `The ${functionName} is throttling.`,
				alarmName: `${functionName}_Throttling_Alarm`,
				okAction: true,
				toleratedThrottlingCount: 0,
			},
			errorPercentageMonitoring: {
				snsTopicName: alarmSnsTopicName,
				alarmDescription: `The ${functionName} is erroring.`,
				alarmName: `${functionName}_Error_Alarm`,
				okAction: true,
				toleratedErrorPercentage: 0,
			},
			memorySize: pollerConfig.overrideLambdaMemoryMB ?? 128,
			timeout,
			handler: `index.handlers.${pollerId}`, // see programmatically generated exports in poller-lambdas/src/index.ts
			fileName: `poller-lambdas.zip`, // shared zip for all the poller-lambdas
		});

		secret.grantRead(lambda);
		secret.grantWrite(lambda);

		// wire up lambda to process its own queue
		lambda.addEventSource(new SqsEventSource(lambdaQueue, { batchSize: 1 }));

		// give permission to lambda to write back to its own queue (to facilitate recursive calling)
		lambdaQueue.grantSendMessages(lambda);

		// allow lambda to write to the ingestion-lambdas queue
		ingestionLambdaQueue.grantSendMessages(lambda); //TODO consider making that queue a destination for the poller-lambda and then the lambda just returns the payload (on success and failure) rather than using SQS SDK within the lambda

		// alarm if the lambda is not invoked often enough (i.e. stalled)
		new GuAlarm(scope, `${pollerId}LambdaStalledAlarm`, {
			app: lambdaAppName,
			snsTopicName: alarmSnsTopicName,
			alarmDescription: `The ${functionName} is potentially stalled (hasn't been invoked as frequently as expected).`,
			alarmName: `${functionName}_Stalled_Alarm`,
			okAction: true,
			threshold: pollerConfig.idealFrequencyInSeconds
				? Math.floor(
						// fixed frequency polling
						Duration.minutes(15).toSeconds() /
							pollerConfig.idealFrequencyInSeconds,
					)
				: 1, // long polling
			evaluationPeriods: 1,
			metric: new Metric({
				metricName: 'Invocations',
				namespace: 'AWS/Lambda',
				period: pollerConfig.idealFrequencyInSeconds
					? Duration.minutes(15) // fixed frequency polling (because 15mins is max delay for SQS)
					: Duration.minutes(3), // long polling (where we http requests would timeout in much less than 3 mins)
				statistic: 'sum',
				dimensionsMap: {
					FunctionName: functionName,
				},
			}),
			treatMissingData: TreatMissingData.BREACHING, // no invocations means no metric entries, so missing needs to mean we alarm
			comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
		});

		// alarm if the lambda is invoked too frequently (indicates it has perhaps gone haywire - which could exhaust rate limits etc.)
		new GuAlarm(scope, `${pollerId}LambdaHaywireAlarm`, {
			app: lambdaAppName,
			snsTopicName: alarmSnsTopicName,
			alarmDescription: `The ${functionName} has potentially gone haywire (has been invoked more frequently than expected).`,
			alarmName: `${functionName}_Haywire_Alarm`,
			okAction: true,
			threshold: pollerConfig.idealFrequencyInSeconds
				? Math.ceil(
						// fixed frequency polling
						Duration.minutes(5).toSeconds() /
							pollerConfig.idealFrequencyInSeconds,
					) * 1.5
				: 60, // long polling (more than once per second is too much)
			evaluationPeriods: 1,
			metric: new Metric({
				metricName: 'Invocations',
				namespace: 'AWS/Lambda',
				period: pollerConfig.idealFrequencyInSeconds
					? Duration.minutes(5) // fixed frequency polling
					: Duration.minutes(1), // long polling
				statistic: 'sum',
				dimensionsMap: {
					FunctionName: functionName,
				},
			}),
			treatMissingData: TreatMissingData.NOT_BREACHING,
			comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
		});
	}
}
