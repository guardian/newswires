import type { Alarms } from '@guardian/cdk';
import { GuPlayApp, GuScheduledLambda } from '@guardian/cdk';
import { AccessScope } from '@guardian/cdk/lib/constants';
import {
	GuAlarm,
	type NoMonitoring,
} from '@guardian/cdk/lib/constructs/cloudwatch';
import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import {
	GuParameter,
	GuStack,
	GuStringParameter,
} from '@guardian/cdk/lib/constructs/core';
import { GuCname } from '@guardian/cdk/lib/constructs/dns';
import { GuVpc, SubnetType } from '@guardian/cdk/lib/constructs/ec2';
import { GuGetS3ObjectsPolicy } from '@guardian/cdk/lib/constructs/iam';
import { GuLambdaFunction } from '@guardian/cdk/lib/constructs/lambda';
import { GuS3Bucket } from '@guardian/cdk/lib/constructs/s3';
import type { App } from 'aws-cdk-lib';
import { aws_logs, Duration } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
	AllowedMethods,
	CachePolicy,
	Distribution,
	OriginProtocolPolicy,
	OriginRequestPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { LoadBalancerV2Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {
	ComparisonOperator,
	Stats,
	TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
import {
	InstanceClass,
	InstanceSize,
	InstanceType,
	Port,
} from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { LoggingFormat } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { LogGroup, MetricFilter } from 'aws-cdk-lib/aws-logs';
import {
	DatabaseInstanceEngine,
	PostgresEngineVersion,
	StorageType,
} from 'aws-cdk-lib/aws-rds';
import { ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { ReceiptRuleSet } from 'aws-cdk-lib/aws-ses';
import { Lambda, LambdaInvocationType, S3 } from 'aws-cdk-lib/aws-ses-actions';
import { Topic } from 'aws-cdk-lib/aws-sns';
import type { Queue } from 'aws-cdk-lib/aws-sqs';
import {
	FAILED_INGESTION_EVENT_TYPE,
	SUCCESSFUL_INGESTION_EVENT_TYPE,
} from '../../shared/constants';
import type { PollerId } from '../../shared/pollers';
import { POLLERS_CONFIG } from '../../shared/pollers';
import { appName, LAMBDA_ARCHITECTURE, LAMBDA_RUNTIME } from './constants';
import { GuDatabase } from './constructs/database';
import { PollerLambda } from './constructs/pollerLambda';

export type NewswiresProps = GuStackProps & {
	sourceQueue: Queue;
	fingerpostQueue: Queue;
	domainName: string;
	enableMonitoring: boolean;
};

export class Newswires extends GuStack {
	constructor(scope: App, id: string, props: NewswiresProps) {
		super(scope, id, { ...props, app: appName });

		const certificateArn = new GuParameter(this, 'CloudFrontCertificateArn', {
			description: `The ARN of the CloudFront certificate for ${props.domainName}, for consumption by the Newswires app stack.`,
			fromSSM: true,
			default: `/${this.stage}/${this.stack}/${appName}/cloudfront/certificateArn`,
			type: 'String',
		});

		const { domainName, enableMonitoring } = props;

		const vpc = GuVpc.fromIdParameter(this, 'VPC');

		const privateSubnets = GuVpc.subnetsFromParameter(this, {
			type: SubnetType.PRIVATE,
			app: appName,
		});

		const stageStackApp = `${this.stage}/${this.stack}/${appName}`;

		const databaseName = 'newswires';

		const instanceSize =
			this.stage === 'PROD' ? InstanceSize.MEDIUM : InstanceSize.SMALL;

		// multiAz on if this is PROD
		const multiAz = this.stage === 'PROD';

		const database = new GuDatabase(this, 'NewswiresDB', {
			app: appName,
			instanceType: InstanceType.of(InstanceClass.T4G, instanceSize),
			allowExternalConnection: true,
			databaseName,
			multiAz,
			devxBackups: true,
			vpcSubnets: {
				subnets: privateSubnets,
			},
			engine: DatabaseInstanceEngine.postgres({
				version: PostgresEngineVersion.VER_16,
			}),
			storageType: StorageType.GP3,
			iops: 3000, // the default for gp3 - not required but nice to declare
			storageThroughput: 125, // the default for gp3
			autoMinorVersionUpgrade: true,
		});

		const feedsBucket = new GuS3Bucket(this, `feeds-bucket-${this.stage}`, {
			app: appName,
			versioned: true,
		});

		const emailBucket = new GuS3Bucket(this, 'NewswiresCopyEmailBucket', {
			app: appName,
			lifecycleRules: [
				{
					expiration: Duration.days(14),
				},
			],
		});

		const fingerpostQueueingLambda = new GuLambdaFunction(
			this,
			`FingerpostQueueingLambda-${this.stage}`,
			{
				app: 'fingerpost-queueing-lambda',
				runtime: LAMBDA_RUNTIME,
				architecture: LAMBDA_ARCHITECTURE,
				handler: 'handler.main',
				fileName: 'fingerpost-queueing-lambda.zip',
				environment: {
					FEEDS_BUCKET_NAME: feedsBucket.bucketName,
					INGESTION_LAMBDA_QUEUE_URL: props.sourceQueue.queueUrl,
				},
			},
		);

		const eventSourceProps = {
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
		};

		fingerpostQueueingLambda.addEventSource(
			new SqsEventSource(props.fingerpostQueue, eventSourceProps),
		);
		props.sourceQueue.grantSendMessages(fingerpostQueueingLambda);

		feedsBucket.grantWrite(fingerpostQueueingLambda);

		const ingestionLambda = new GuLambdaFunction(
			this,
			`IngestionLambda-${this.stage}`,
			{
				app: 'ingestion-lambda',
				runtime: LAMBDA_RUNTIME,
				architecture: LAMBDA_ARCHITECTURE,
				handler: 'handler.main',
				// each execution can handle up to 10 messages, so this is up
				// to 100 messages in flight; should be more than powerful enough
				// in high news events
				reservedConcurrentExecutions: 10,
				fileName: 'ingestion-lambda.zip',
				environment: {
					FEEDS_BUCKET_NAME: feedsBucket.bucketName,
					EMAIL_BUCKET_NAME: emailBucket.bucketName,
					DATABASE_ENDPOINT_ADDRESS: database.dbInstanceEndpointAddress,
					DATABASE_PORT: database.dbInstanceEndpointPort,
					DATABASE_NAME: databaseName,
				},
				vpc,
				vpcSubnets: {
					subnets: privateSubnets,
				},
				loggingFormat: LoggingFormat.TEXT,
			},
		);

		ingestionLambda.connections.allowTo(database, Port.tcp(5432));

		// Create email filter lambda for SES processing (for 'sport.copy' emails)
		const emailFilterLambda = new GuLambdaFunction(
			this,
			`EmailFilterLambda-${this.stage}`,
			{
				app: 'email-filter-lambda',
				runtime: LAMBDA_RUNTIME,
				architecture: LAMBDA_ARCHITECTURE,
				handler: 'handler.main',
				fileName: 'email-filter-lambda.zip',
				reservedConcurrentExecutions: 2, // email filter doesn't need high concurrency
				timeout: Duration.seconds(30),
				loggingFormat: LoggingFormat.TEXT,
			},
		);

		const incomingEmailAddress = new GuStringParameter(
			this,
			`incoming-copy-email-address`,
			{
				fromSSM: true,
				default: `/fingerpost/${this.stage}/incomingCopyEmailAddress`,
			},
		).valueAsString;

		/** There can only be one active ruleset at a time. And you can only activate a ruleset as a manual action in
		 * the AWS console. So we have manually created and activated a ruleset called "default", which CODE and PROD
		 * can then add rules to.
		 * nb. Rules are also added to this ruleset by the `editorial-wires` project.
		 * @see https://github.com/guardian/editorial-wires
		 */
		const activeRuleSet = ReceiptRuleSet.fromReceiptRuleSetName(
			this,
			'ses-ruleset',
			'default',
		);

		activeRuleSet.addRule('incoming-copy-email-rule', {
			receiptRuleName: `${appName}-incoming-copy-email-rule-${this.stage}`,
			recipients: [incomingEmailAddress],
			scanEnabled: true, // scan for spam and viruses
			actions: [
				new Lambda({
					function: emailFilterLambda,
					/**
					 * @todo we'll need to change the invocation type if/when we want to make the lambda blocking
					 */
					invocationType: LambdaInvocationType.EVENT,
				}),
				new S3({
					bucket: emailBucket,
					objectKeyPrefix: '',
				}),
				new Lambda({
					function: ingestionLambda,
					invocationType: LambdaInvocationType.EVENT,
				}),
			],
		});

		ingestionLambda.addEventSource(
			new SqsEventSource(props.sourceQueue, eventSourceProps),
		);

		feedsBucket.grantReadWrite(ingestionLambda);
		database.grantConnect(ingestionLambda);
		emailBucket.grantRead(ingestionLambda);

		const alarmSnsTopic = new Topic(this, `${appName}-email-alarm-topic`);

		const ingestionLogGroup = LogGroup.fromLogGroupName(
			this,
			'IngestionLogGroup',
			`/aws/lambda/${ingestionLambda.functionName}`,
		);

		const ingestionEventMetricFilter = (eventType: string) =>
			new MetricFilter(this, `IngestionSourceFeedsFilter-${eventType}`, {
				logGroup: ingestionLogGroup,
				metricNamespace: `${stageStackApp}-ingestion-lambda`,
				metricName: `IngestionSourceFeeds-${eventType.toLowerCase()}`,
				metricValue: '1',
				filterPattern: aws_logs.FilterPattern.stringValue(
					'$.eventType',
					'=',
					eventType,
				),
				dimensions: { supplier: '$.supplier' },
			});

		ingestionEventMetricFilter(SUCCESSFUL_INGESTION_EVENT_TYPE);
		const failedIngestionMetricFilter = ingestionEventMetricFilter(
			FAILED_INGESTION_EVENT_TYPE,
		);

		new GuAlarm(this, 'FailedIngestionAlarm', {
			actionsEnabled: this.stage === 'PROD',
			okAction: true,
			alarmName: `Ingestion failed on Newswires ${this.stage}`,
			alarmDescription: `Stories have failed to ingest into Newswires. We should investigate why and remediate`,
			app: appName,
			comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
			treatMissingData: TreatMissingData.NOT_BREACHING,
			metric: failedIngestionMetricFilter.metric({
				period: Duration.minutes(1),
				statistic: Stats.SUM,
			}),
			snsTopicName: alarmSnsTopic.topicName,
			threshold: 1,
			evaluationPeriods: 1,
		});

		const scheduledCleanupLambda = new GuScheduledLambda(
			this,
			`ScheduledCleanupLambda-${this.stage}`,
			{
				app: 'cleanup-lambda',
				runtime: LAMBDA_RUNTIME,
				architecture: LAMBDA_ARCHITECTURE,
				handler: 'handler.main',
				fileName: 'cleanup-lambda.zip',
				timeout: Duration.millis(45000),
				environment: {
					DATABASE_ENDPOINT_ADDRESS: database.dbInstanceEndpointAddress,
					DATABASE_PORT: database.dbInstanceEndpointPort,
					DATABASE_NAME: databaseName,
				},
				vpc,
				vpcSubnets: {
					subnets: privateSubnets,
				},
				rules: [
					{
						schedule: Schedule.cron({ hour: '5', minute: '00', weekDay: '*' }), // Every day at 5am
					},
				],
				monitoringConfiguration: {
					noMonitoring: true,
				},
			},
		);

		scheduledCleanupLambda.connections.allowTo(database, Port.tcp(5432));
		database.grantConnect(scheduledCleanupLambda);

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

		Object.entries(POLLERS_CONFIG).map(
			([pollerId, pollerConfig]) =>
				new PollerLambda(this, {
					pollerId: pollerId as PollerId,
					pollerConfig,
					ingestionLambdaQueue: props.sourceQueue,
					alarmSnsTopicName: alarmSnsTopic.topicName,
					feedsBucket: feedsBucket,
				}),
		);

		const newswiresApp = new GuPlayApp(this, {
			app: appName,
			access: { scope: AccessScope.PUBLIC },
			privateSubnets,
			instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL),
			certificateProps: {
				domainName,
			},
			monitoringConfiguration,
			userData: {
				distributable: {
					fileName: `${appName}.deb`,
					executionStatement: `dpkg -i /${appName}/${appName}.deb`,
				},
			},
			scaling,
			applicationLogging: { enabled: true, systemdUnitName: appName },
			imageRecipe: 'editorial-tools-jammy-java17',
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
			instanceMetricGranularity: this.stage === 'PROD' ? '1Minute' : '5Minute',
		});

		const cloudFrontLogsBucket = new GuS3Bucket(
			this,
			`newswires-cloudfront-bucket-${this.stage}`,
			{
				app: appName,
				lifecycleRules: [
					{
						expiration: Duration.days(30),
					},
				],
				objectOwnership: ObjectOwnership.OBJECT_WRITER,
			},
		);

		const cloudfrontCertificate = Certificate.fromCertificateArn(
			this,
			`newswires-cloudfront-certificate-${this.stage}`,
			certificateArn.valueAsString,
		);

		const newswiresCloudFrontDistro = new Distribution(
			this,
			`newswires-cloudfront-distro-${this.stage}`,
			{
				defaultBehavior: {
					origin: new LoadBalancerV2Origin(newswiresApp.loadBalancer, {
						protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
					}),
					allowedMethods: AllowedMethods.ALLOW_ALL,
					originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
					cachePolicy: CachePolicy.CACHING_DISABLED,
				},
				logBucket: cloudFrontLogsBucket,
				certificate: cloudfrontCertificate,
				domainNames: [domainName],
			},
		);

		// Add the domain name
		new GuCname(this, 'DnsRecord', {
			app: appName,
			domainName: domainName,
			ttl: Duration.minutes(1),
			resourceRecord: newswiresCloudFrontDistro.domainName,
		});

		database.grantConnect(newswiresApp.autoScalingGroup);
		newswiresApp.autoScalingGroup.connections.addSecurityGroup(
			database.accessSecurityGroup,
		);
	}
}
