import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuCname } from '@guardian/cdk/lib/constructs/dns';
import {
	GuParameter,
	GuStack,
	GuStringParameter,
} from '@guardian/cdk/lib/constructs/core';
import { GuLambdaFunction } from '@guardian/cdk/lib/constructs/lambda';
import { GuS3Bucket } from '@guardian/cdk/lib/constructs/s3';
import type { App } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { ArnPrincipal, User } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { GuDatabase } from './constructs/database';
import { Alarms, GuPlayApp } from '@guardian/cdk';
import { NoMonitoring } from '@guardian/cdk/lib/constructs/cloudwatch';
import { AccessScope } from '@guardian/cdk/lib/constants';
import { GuGetS3ObjectsPolicy } from '@guardian/cdk/lib/constructs/iam';
import { GuVpc, SubnetType } from '@guardian/cdk/lib/constructs/ec2';

export type WiresFeedsProps = GuStackProps & {
	domainName: string;
	enableMonitoring: boolean;
};
const app = 'wires-feeds';

export class WiresFeeds extends GuStack {
	constructor(scope: App, id: string, props: WiresFeedsProps) {
		super(scope, id, { ...props, app });

		const { domainName, enableMonitoring } = props;

		const privateSubnets = GuVpc.subnetsFromParameter(this, {
			type: SubnetType.PRIVATE,
			app,
		});

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

		const databaseName = 'newswires';

		const database = new GuDatabase(this, 'NewswiresDB', {
			app,
			instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL),
			allowExternalConnection: true,
			databaseName,
			multiAz: false,
			devxBackups: true,
			vpcSubnets: {
				subnets: privateSubnets,
			},
		});

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
					DATABASE_ENDPOINT_ADDRESS: database.dbInstanceEndpointAddress,
					DATABASE_PORT: database.dbInstanceEndpointPort,
					DATABASE_NAME: databaseName,
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

		database.grantConnect(ingestionLambda);

		const panDomainSettingsBucket = new GuParameter(
			this,
			'PanDomainSettingsBucket',
			{
				description: 'Bucket name for pan-domain auth settings',
				fromSSM: true,
				default: `/${stageStackApp}/pan-domain-settings-bucket`,
				type: 'String',
			},
		);

		const permissionsBucketName = new GuParameter(this, 'PermissionsBucket', {
			description: 'Bucket name for permissions data',
			fromSSM: true,
			default: `/${stageStackApp}/permissions-bucket`,
			type: 'String',
		});

		const alarmSnsTopic = new Topic(this, `${app}-email-alarm-topic`);

		const scaling = {
			minimumInstances: 1,
			maximumInstances: 2,
		};

		const monitoringConfiguration: Alarms | NoMonitoring = enableMonitoring
			? {
					snsTopicName: alarmSnsTopic.topicName,
					unhealthyInstancesAlarm: true,
					http5xxAlarm: {
						tolerated5xxPercentage: 10,
						numberOfMinutesAboveThresholdBeforeAlarm: 1,
					},
				}
			: { noMonitoring: true };

		const nwApp = 'newswires';

		const newswiresApp = new GuPlayApp(this, {
			app,
			access: { scope: AccessScope.PUBLIC },
			privateSubnets,
			instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL),
			certificateProps: {
				domainName,
			},
			monitoringConfiguration,
			userData: {
				distributable: {
					fileName: `${nwApp}.deb`,
					executionStatement: `dpkg -i /${app}/${nwApp}.deb`, // TODO fix pls
				},
			},
			scaling,
			applicationLogging: { enabled: true, systemdUnitName: nwApp },
			imageRecipe: 'editorial-tools-focal-java17-ARM-WITH-cdk-base',
			roleConfiguration: {
				additionalPolicies: [
					new GuGetS3ObjectsPolicy(this, 'PandaAuthPolicy', {
						bucketName: panDomainSettingsBucket.valueAsString,
					}),
					new GuGetS3ObjectsPolicy(this, 'PermissionsCachePolicy', {
						bucketName: permissionsBucketName.valueAsString,
						paths: [`${this.stage}/*`],
					}),
				],
			},
		});

		// Add the domain name
		new GuCname(this, 'DnsRecord', {
			app: nwApp,
			domainName: domainName,
			ttl: Duration.minutes(1),
			resourceRecord: newswiresApp.loadBalancer.loadBalancerDnsName,
		});

		database.grantConnect(newswiresApp.autoScalingGroup);
		newswiresApp.autoScalingGroup.connections.addSecurityGroup(
			database.accessSecurityGroup,
		);
	}
}
