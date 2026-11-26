import { GuStack, type GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { type App, ArnFormat, CfnOutput } from 'aws-cdk-lib';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { CfnLoggingConfiguration, CfnWebACL } from 'aws-cdk-lib/aws-wafv2';

const managedRuleGroups = [
	'AWSManagedRulesCommonRuleSet',
	'AWSManagedRulesKnownBadInputsRuleSet',
	'AWSManagedRulesAdminProtectionRuleSet',
	'AWSManagedRulesAmazonIpReputationList',
	'AWSManagedRulesAnonymousIpList',
	'AWSManagedRulesLinuxRuleSet',
	'AWSManagedRulesUnixRuleSet',
];

const countManagedRuleGroup = (
	name: string,
	index: number,
): CfnWebACL.RuleProperty => ({
	name: `AWS-${name}`,
	priority: index + 1,
	overrideAction: { count: {} },
	statement: {
		managedRuleGroupStatement: {
			vendorName: 'AWS',
			name,
		},
	},
	visibilityConfig: {
		cloudWatchMetricsEnabled: true,
		metricName: `AWS-${name}`,
		sampledRequestsEnabled: true,
	},
});

/**
 * AWS WAF Web ACL for Newswires CloudFront distribution.
 *
 * Rules included (all in COUNT/log-only mode):
 * - AWS managed rule groups (same baseline as other editorial tools, e.g. Media Atom Maker)
 * - Rate limiting (2000 requests per 5 minutes per IP)
 *
 * Full request logs are written to the CloudWatch log group
 * `aws-waf-logs-newswires-<STAGE>` in us-east-1.
 */
export class NewswiresWaf extends GuStack {
	public readonly webAcl: CfnWebACL;

	constructor(scope: App, id: string, props: GuStackProps) {
		super(scope, id, {
			env: {
				region: 'us-east-1', // CloudFront WAF must be in us-east-1
			},
			...props,
		});

		this.webAcl = new CfnWebACL(this, 'WebAcl', {
			scope: 'CLOUDFRONT',
			defaultAction: { allow: {} },
			name: `newswires-waf-${this.stage}`,
			visibilityConfig: {
				cloudWatchMetricsEnabled: true,
				metricName: `newswires-waf-${this.stage}`,
				sampledRequestsEnabled: true,
			},
			rules: [
				...managedRuleGroups.map(countManagedRuleGroup),
				{
					name: 'RateLimitRule',
					priority: managedRuleGroups.length + 1,
					action: { count: {} },
					statement: {
						rateBasedStatement: {
							limit: 2000,
							aggregateKeyType: 'IP',
						},
					},
					visibilityConfig: {
						cloudWatchMetricsEnabled: true,
						metricName: 'RateLimitRuleMetrics',
						sampledRequestsEnabled: true,
					},
				},
			],
		});

		// WAF requires the log group name to start with `aws-waf-logs-`
		const logGroupName = `aws-waf-logs-newswires-${this.stage}`;
		const logGroup = new LogGroup(this, 'WafLogGroup', {
			logGroupName,
			retention: RetentionDays.THREE_MONTHS,
		});

		// Grant WAF's log delivery service write access up front, so WAF doesn't
		// have to create a resource policy at deploy time (which needs logs:PutResourcePolicy)
		const { policyDependable } = logGroup.addToResourcePolicy(
			new PolicyStatement({
				principals: [new ServicePrincipal('delivery.logs.amazonaws.com')],
				actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
				resources: [logGroup.logGroupArn],
				conditions: {
					StringEquals: { 'aws:SourceAccount': this.account },
					ArnLike: {
						'aws:SourceArn': this.formatArn({ service: 'logs', resource: '*' }),
					},
				},
			}),
		);

		const loggingConfiguration = new CfnLoggingConfiguration(
			this,
			'WafLogging',
			{
				resourceArn: this.webAcl.attrArn,
				// WAF rejects the `:*`-suffixed ARN that LogGroup.logGroupArn resolves to
				logDestinationConfigs: [
					this.formatArn({
						service: 'logs',
						resource: 'log-group',
						resourceName: logGroupName,
						arnFormat: ArnFormat.COLON_RESOURCE_NAME,
					}),
				],
				redactedFields: [
					{ singleHeader: { Name: 'cookie' } },
					{ singleHeader: { Name: 'authorization' } },
					{ singleHeader: { Name: 'csrf-token' } },
				],
			},
		);
		loggingConfiguration.node.addDependency(logGroup);
		if (policyDependable) {
			loggingConfiguration.node.addDependency(policyDependable);
		}

		// The Newswires stack (eu-west-1) cannot reference this us-east-1 stack directly.
		// Copy this value into SSM in eu-west-1 at /<STAGE>/editorial-feeds/newswires/cloudfront/webAclArn
		new CfnOutput(this, 'WebAclArn', {
			value: this.webAcl.attrArn,
		});
	}
}
