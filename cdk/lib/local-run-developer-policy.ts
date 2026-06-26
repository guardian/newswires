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

	new GuDeveloperPolicyExperimental(scope, 'NewswiresCodeLocalRunPolicy', {
		permission: 'newswires-code-local-run',
		description: 'Run Newswires locally against CODE DB',
		statements: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['sts:GetCallerIdentity'],
				resources: ['*'],
			}),
			// The local-run flow only reads the four database/* params
			// (username, port, endpoint-address, database-name).
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['ssm:GetParameter'],
				resources: [ssmArn(scope, `${stage}/${stack}/${app}/database/*`)],
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					// ssm-scala (the --rds-tunnel transport) installs a short-lived
					// SSH key on the instance via Run Command, then opens the
					// session-manager tunnel. Actions below confirmed against
					// CloudTrail for a `./scripts/start --use-CODE` run.
					'ssm:SendCommand',
					'ssm:GetCommandInvocation',
					'ssm:StartSession',
					'ssm:TerminateSession',
					'ssm:ResumeSession',
					'ssm:DescribeSessions',
					'ssm:GetConnectionStatus',
					'ec2:DescribeInstances',
					// ssm-scala tags the instance ('tainted') to record who accessed it.
					'ec2:CreateTags',
					'rds:DescribeDBInstances',
				],
				resources: ['*'],
			}),
			// IAM-auth connection to the CODE RDS instance from the local app.
			// The app connects as the 'postgres' master user (see database/username
			// SSM param), so the ARN must target that specific dbuser. Mirrors the
			// ARN built by GuDatabase.grantConnect.
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
			// Logging in locally: the app reads pan-domain auth settings and
			// permissions data from S3 using the developer's own credentials.
			// Mirrors the GuGetS3ObjectsPolicy grants on the deployed app role.
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['s3:GetObject'],
				resources: [`arn:aws:s3:::${panDomainSettingsBucketName}/*`],
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['s3:GetObject'],
				resources: [`arn:aws:s3:::${permissionsBucketName}/${stage}/*`],
			}),
		],
	});
}
