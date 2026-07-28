import type { GuStack } from '@guardian/cdk/lib/constructs/core';
import { GuDeveloperPolicyExperimental } from '@guardian/cdk/lib/experimental/constructs/iam/policies';
import { ArnFormat } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import type { GuDatabase } from './constructs/database';

function ssmArn(stack: GuStack, parameterName: string): string {
	return stack.formatArn({
		service: 'ssm',
		resource: 'parameter',
		/* Strip any leading slash because formatArn already inserts a separator between
		   resource and resourceName so a leading slash would produce a double slash. */
		resourceName: parameterName.replace(/^\//, ''),
	});
}

export function createLocalRunDeveloperPolicy(
	scope: GuStack,
	stack: string,
	app: string,
	db: GuDatabase,
	panDomainSettingsBucketName: string,
	permissionsBucketName: string,
) {
	const stage = 'CODE';
	const region = scope.region;

	/**
	 * SSM documents used by ssm-scala's `--rds-tunnel` transport. These are
	 * AWS-owned public documents, whose ARNs have an *empty* account field
	 * (e.g. `arn:aws:ssm:eu-west-1::document/AWS-RunShellScript`). We keep the
	 * region pinned to the stack region but must leave the account blank,
	 * otherwise the resource never matches and the action is denied.
	 * https://docs.aws.amazon.com/systems-manager/latest/userguide/documents.html
	 */
	function ssmDocumentArn(name: string) {
		return scope.formatArn({
			service: 'ssm',
			region,
			account: '',
			resource: 'document',
			resourceName: name,
		});
	}
	/**
	 * The tags that we use to specify the Newswires CODE EC2 instances when
	 * connecting via ssm-scala's `--rds-tunnel` transport (`-t newswires,CODE`).
	 */
	const newswiresInstanceTagConditions = {
		StringEquals: {
			'ssm:resourceTag/App': app,
			'ssm:resourceTag/Stack': stack,
			'ssm:resourceTag/Stage': stage,
		},
	};

	const newswiresInstanceArn = scope.formatArn({
		service: 'ec2',
		resource: 'instance',
		resourceName: '*',
	});

	new GuDeveloperPolicyExperimental(scope, 'NewswiresCodeLocalRunPolicy', {
		grantId: 'newswires-local-run-against-code-db',
		friendlyName: 'Run Newswires locally against CODE DB',
		withoutPolicyChecks: true,
		statements: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ssm:GetParameter'],
				resources: [ssmArn(scope, `${stage}/${stack}/${app}/database/*`)],
			}),
			/**
			 * Purpose — account-wide discovery / status actions.
			 * Rationale for scope: AWS does not support resource-level
			 * permissions for these, so they can only be granted on `*`. We
			 * restrict requests to the stack's regional endpoint, since all of
			 * the relevant resources are in eu-west-1.
			 */
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					'ec2:DescribeInstances',
					'rds:DescribeDBInstances',
					'ssm:GetCommandInvocation',
					'ssm:GetConnectionStatus',
					'ssm:DescribeSessions',
				],
				resources: ['*'],
				conditions: {
					StringEquals: { 'aws:RequestedRegion': region },
				},
			}),
			// Tier 2 — instance-targeted actions, scoped to the Newswires CODE
			// instances by tag. SendCommand needs both the target instance(s) and
			// the document; a tag condition can't be applied to the document (it
			// has no such tags), so the instance and document grants are split
			// into separate statements — the standard AWS pattern.
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ssm:SendCommand'],
				resources: [newswiresInstanceArn],
				conditions: newswiresInstanceTagConditions,
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ssm:SendCommand'],
				resources: [ssmDocumentArn('AWS-RunShellScript')],
			}),
			// StartSession, likewise split: the tagged instance(s) plus the
			// session-manager documents ssm-scala uses for the tunnel.
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ssm:StartSession'],
				resources: [newswiresInstanceArn],
				conditions: newswiresInstanceTagConditions,
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ssm:StartSession'],
				resources: [
					ssmDocumentArn('AWS-StartPortForwardingSessionToRemoteHost'),
					ssmDocumentArn('AWS-StartSSHSession'),
					ssmDocumentArn('SSM-SessionManagerRunShell'),
				],
			}),
			/**
			 * Purpose: Let a developer close sessions they started. Session
			 * Manager applies `aws:ssmmessages:session-id` to each session; for
			 * an assumed role its value starts with `${aws:userid}`, so this works
			 * for Janus credentials without reconstructing the session ARN.
			 */
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ssm:TerminateSession'],
				resources: ['*'],
				conditions: {
					StringEquals: { 'aws:RequestedRegion': region },
					StringLike: {
						'ssm:resourceTag/aws:ssmmessages:session-id': '${aws:userid}*',
					},
				},
			}),
			/**
			 * ResumeSession supports session resources, but an assumed role's
			 * `${aws:userid}` does not match the session ARN. AWS documents the
			 * system-tag ownership condition above for TerminateSession only, so
			 * resume remains available for sessions through the stack's regional
			 * endpoint.
			 */
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ssm:ResumeSession'],
				resources: ['*'],
				conditions: {
					StringEquals: { 'aws:RequestedRegion': region },
				},
			}),
			/**
			 * ssm-scala tags the instance ('tainted') to record who accessed it.
			 * Can potentially be removed once ssm-scala is deprecated.
			 * */
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ec2:CreateTags'],
				resources: [
					scope.formatArn({
						service: 'ec2',
						resource: 'instance',
						resourceName: '*',
					}),
				],
			}),
			/**
			 * Purpose: Allow the developer to connect to the CODE RDS instance
			 * Rationale for scope: The RDS DB user ARN is unique to the instance
			 * and the user, so this is already scoped to the correct instance.
			 * It might be good to create a separate, non-root db user for developers
			 * but we don't have one at the time of writing.
			 */
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['rds-db:connect'],
				resources: [
					scope.formatArn({
						arnFormat: ArnFormat.COLON_RESOURCE_NAME,
						service: 'rds-db',
						resource: 'dbuser',
						resourceName: `${db.instanceResourceId}/postgres`,
					}),
				],
			}),
			/**
			 * Logging in locally: the app reads pan-domain auth settings and
			 * permissions data from S3.
			 * Mirrors the GuGetS3ObjectsPolicy grants on the deployed app role.
			 */
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['s3:GetObject'],
				resources: [
					`arn:aws:s3:::${panDomainSettingsBucketName}/local.dev-gutools.co.uk.settings`,
					`arn:aws:s3:::${panDomainSettingsBucketName}/local.dev-gutools.co.uk.settings.public`,
					/**
					 * The exact object key for this certificate is only found at
					 * runtime so we can't specify it exactly here. The certificate
					 * is not stage-specific either so we can't restrict to a given stage
					 * in the way we are doing for other objects.
					 */
					`arn:aws:s3:::${panDomainSettingsBucketName}/pan-domain-auth-*.p12`,
				],
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['s3:GetObject'],
				resources: [
					`arn:aws:s3:::${permissionsBucketName}/${stage}/permissions.json`,
				],
			}),
		],
	});
}
