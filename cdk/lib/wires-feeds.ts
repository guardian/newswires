import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack, GuStringParameter } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { ArnPrincipal, User } from 'aws-cdk-lib/aws-iam';
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

			const queue = new Queue(this, `${topicType}-queue`, {
				enforceSSL: true,
				retentionPeriod: Duration.days(14),
			});
			topic.addSubscription(
				new SqsSubscription(queue, { rawMessageDelivery: true }),
			);
		}
	}
}
