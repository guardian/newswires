import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack, GuStringParameter } from '@guardian/cdk/lib/constructs/core';
import { GuLambdaFunction } from '@guardian/cdk/lib/constructs/lambda';
import type { App } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { ArnPrincipal, User } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
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

		const topicPairs = ['fingerpost', 'source'];

		for (const topicType of topicPairs) {
			const topic = new Topic(this, `${topicType}-topic`, {
				enforceSSL: true,
			});
			topic.grantPublish(new ArnPrincipal(user.userArn));

			const queueName = `${topicType}-queue`;
			const visibilityTimeout = Duration.minutes(5);

			const deadLetterQueue = new Queue(
				this,
				`${queueName}DeadLetterQueue-${props.stage}`,
				{ visibilityTimeout },
			);

			const queue = new Queue(this, queueName, {
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
		}

		new GuLambdaFunction(this, `IngestionLambda-${this.stage}`, {
			app: 'ingestion-lambda',
			runtime: Runtime.NODEJS_20_X,
			handler: 'handler.main',
			fileName: 'ingestion-lambda.zip',
		});
	}
}
