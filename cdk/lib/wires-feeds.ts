import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack, GuStringParameter } from '@guardian/cdk/lib/constructs/core';
import { GuLambdaFunction } from '@guardian/cdk/lib/constructs/lambda';
import { GuS3Bucket } from '@guardian/cdk/lib/constructs/s3';
import type { App } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { ArnPrincipal, User } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';

export type WiresFeedsProps = GuStackProps;
const app = 'wires-feeds';

export class WiresFeeds extends GuStack {
	constructor(scope: App, id: string, props: WiresFeedsProps) {
		super(scope, id, { ...props, app });

		const stageStackApp = `${this.stage}/${this.stack}/${app}`;

		const fingerpostPublishingUserArn = new GuStringParameter(
			this,
			'fingerpost-publishing-user-arn',
			{
				fromSSM: true,
				default: `/${stageStackApp}/fingerpost-publishing-user-arn`,
			},
		).valueAsString;

		const user = User.fromUserArn(
			this,
			'fingerpost-publishing-user',
			fingerpostPublishingUserArn,
		);

		function createTopicQueue(scope: GuStack, topicType: string) {
			const topic = new Topic(scope, `${topicType}-topic`, {
				enforceSSL: true,
			});
			topic.grantPublish(new ArnPrincipal(user.userArn));

			const queueName = `${topicType}-queue`;
			const visibilityTimeout = Duration.minutes(5);

			const deadLetterQueue = new Queue(
				scope,
				`${queueName}DeadLetterQueue-${props.stage}`,
				{ visibilityTimeout },
			);

			const queue = new Queue(scope, queueName, {
				enforceSSL: true,
				retentionPeriod: Duration.days(14),
				// We are using this queue in conjunction with a lambda SqsEventSource
				// visibilityTimeout is set by default to 5 minutes to ensure that the lambda has
				// enough time to process the message before it becomes visible again.
				visibilityTimeout: Duration.minutes(5),
				deadLetterQueue: {
					queue: deadLetterQueue,
					maxReceiveCount: 3,
				},
			});

			topic.addSubscription(
				new SqsSubscription(queue, { rawMessageDelivery: true }),
			);

			return queue;
		}

		/** A topic and queue for the 'raw' wires feed.
		 * Not receiving data yet so we aren't currently doing anything more with it.
		 */
		createTopicQueue(this, 'source');

		const fingerPostQueue = createTopicQueue(this, 'fingerpost');

		const feedsBucket = new GuS3Bucket(this, `feeds-bucket-${this.stage}`, {
			app,
			versioned: true,
		});

		const ingestionLambda = new GuLambdaFunction(
			this,
			`IngestionLambda-${this.stage}`,
			{
				app: 'ingestion-lambda',
				runtime: Runtime.NODEJS_20_X,
				handler: 'handler.main',
				fileName: 'ingestion-lambda.zip',
				environment: {
					FEEDS_BUCKET_NAME: feedsBucket.bucketName,
				},
			},
		);

		const eventSource = new SqsEventSource(fingerPostQueue, {
			/**
			 * This is required to allow us to deal with failures of particular
			 * records handed to a lambda by an SQS queue. Without this, the
			 * lambda will retry the entire batch of records, which is not what
			 * we want.
			 *
			 * See https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#services-sqs-batchfailurereporting
			 *
			 */
			reportBatchItemFailures: true,
		});

		ingestionLambda.addEventSource(eventSource);

		feedsBucket.grantWrite(ingestionLambda);
	}
}
