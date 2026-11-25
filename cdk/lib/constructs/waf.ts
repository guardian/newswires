import { GuStack, type GuStackProps } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import { CfnWebACL } from 'aws-cdk-lib/aws-wafv2';

export type NewswiresWafProps = GuStackProps & {
	/**
	 * Whether this WAF is in monitoring (COUNT) mode.
	 * Default: true (log-only mode)
	 */
	monitoringMode?: boolean;
};

/**
 * AWS WAF Web ACL for Newswires CloudFront distribution.
 *
 * Rules included (all in COUNT/log-only mode by default):
 * - AWS Managed Rules - Common Rule Group (SQL injection, XSS, etc.)
 * - AWS Managed Rules - Known Bad Inputs
 * - Rate limiting (2000 requests per 5 minutes per IP)
 */
export class NewswiresWaf extends GuStack {
	public readonly webAcl: CfnWebACL;
	public readonly webAclArn: string;

	constructor(scope: App, id: string, props: NewswiresWafProps) {
		super(scope, id, {
			env: {
				region: 'us-east-1', // CloudFront WAF must be in us-east-1
			},
			...props,
		});

		const { monitoringMode = true } = props;

		const action = monitoringMode ? { count: {} } : { block: {} };

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
					action,
					statement: {
						managedRuleGroupStatement: {
							vendorName: 'AWS',
							name: 'AWSManagedRulesCommonRuleSet',
							excludedRules: [
								{
									name: 'SizeRestrictions_BODY',
								},
							],
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
					action,
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
					action,
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

		this.webAclArn = this.webAcl.attrArn;
	}
}
