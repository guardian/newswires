import { GuAlarm } from '@guardian/cdk/lib/constructs/cloudwatch';
import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack, GuStringParameter } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import {
	ComparisonOperator,
	Stats,
	TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
import { ArnPrincipal, User } from 'aws-cdk-lib/aws-iam';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { appName } from './constants';

export type WiresFeedsProps = GuStackProps;
const app = 'wires-feeds';

export class WiresFeeds extends GuStack {
	public readonly sourceQueue: Queue;
	public readonly fingerpostQueue: Queue;
	public readonly alarmSnsTopic: Topic;

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
			topic.applyRemovalPolicy(RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE);
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
				removalPolicy: RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
			});

			topic.addSubscription(
				new SqsSubscription(queue, { rawMessageDelivery: true }),
			);

			return queue;
		}
		// An SNS topic to send alarms to
		this.alarmSnsTopic = new Topic(this, `${appName}-email-alarm-topic`);

		/** A topic and queue for the 'raw' wires feed.*/
		this.sourceQueue = createTopicQueue(this, 'source');

		this.fingerpostQueue = createTopicQueue(this, 'fingerpost');

		if (this.fingerpostQueue.deadLetterQueue) {
			new GuAlarm(this, 'FingerpostDeadLetterQueueAlarm', {
				actionsEnabled: this.stage === 'CODE',
				okAction: true,
				alarmName: `Messages in DLQ for Fingerpost queue ${this.stage}`,
				alarmDescription: `There are messages in the dead letter queue for the Fingerpost queue. We should investigate why and remediate`,
				app: appName,
				comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
				treatMissingData: TreatMissingData.NOT_BREACHING,
				metric:
					this.fingerpostQueue.deadLetterQueue.queue.metricApproximateNumberOfMessagesVisible(
						{
							period: Duration.minutes(1),
							statistic: Stats.MAXIMUM,
						},
					),
				snsTopicName: this.alarmSnsTopic.topicName,
				threshold: 3,
				evaluationPeriods: 1,
			});
		}

		if (this.sourceQueue.deadLetterQueue) {
			new GuAlarm(this, 'SourceDeadLetterQueueAlarm', {
				actionsEnabled: this.stage === 'CODE',
				okAction: true,
				alarmName: `Messages in DLQ for the source queue ${this.stage}`,
				alarmDescription: `There are messages in the dead letter queue for the source queue. We should investigate why and remediate`,
				app: appName,
				comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
				treatMissingData: TreatMissingData.NOT_BREACHING,
				metric:
					this.sourceQueue.deadLetterQueue.queue.metricApproximateNumberOfMessagesVisible(
						{
							period: Duration.minutes(1),
							statistic: Stats.MAXIMUM,
						},
					),
				snsTopicName: this.alarmSnsTopic.topicName,
				threshold: 3,
				evaluationPeriods: 1,
			});
		}
	}
}
