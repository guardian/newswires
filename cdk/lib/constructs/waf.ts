import { GuStack, type GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { type App, CfnOutput } from 'aws-cdk-lib';
import { CfnWebACL } from 'aws-cdk-lib/aws-wafv2';

/**
 * AWS WAF Web ACL for Newswires CloudFront distribution.
 *
 * Rules included (all in COUNT/log-only mode):
 * - AWS Managed Rules - Common Rule Group (SQL injection, XSS, etc.)
 * - AWS Managed Rules - Known Bad Inputs
 * - Rate limiting (2000 requests per 5 minutes per IP)
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
				{
					name: 'AWSManagedRulesCommonRuleGroup',
					priority: 1,
					overrideAction: { count: {} },
					statement: {
						managedRuleGroupStatement: {
							vendorName: 'AWS',
							name: 'AWSManagedRulesCommonRuleSet',
						},
					},
					visibilityConfig: {
						cloudWatchMetricsEnabled: true,
						metricName: 'AWSManagedRulesCommonRuleGroupMetrics',
						sampledRequestsEnabled: true,
					},
				},
				{
					name: 'AWSManagedRulesKnownBadInputsRuleGroup',
					priority: 2,
					overrideAction: { count: {} },
					statement: {
						managedRuleGroupStatement: {
							vendorName: 'AWS',
							name: 'AWSManagedRulesKnownBadInputsRuleSet',
						},
					},
					visibilityConfig: {
						cloudWatchMetricsEnabled: true,
						metricName: 'AWSManagedRulesKnownBadInputsRuleGroupMetrics',
						sampledRequestsEnabled: true,
					},
				},
				{
					name: 'RateLimitRule',
					priority: 3,
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

		// The Newswires stack (eu-west-1) cannot reference this us-east-1 stack directly.
		// Copy this value into SSM in eu-west-1 at /<STAGE>/editorial-feeds/newswires/cloudfront/webAclArn
		new CfnOutput(this, 'WebAclArn', {
			value: this.webAcl.attrArn,
		});
	}
}
