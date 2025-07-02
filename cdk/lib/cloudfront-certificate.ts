import { GuStack, type GuStackProps } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { appName } from './constants';

export type CloudFrontProps = GuStackProps & {
	domainName: string;
};

export class NewswiresCloudfrontCertificate extends GuStack {
	constructor(scope: App, id: string, props: CloudFrontProps) {
		super(scope, id, {
			app: appName,
			env: {
				region: 'us-east-1',
			},
			crossRegionReferences: true,
			...props,
		});

		const stageStackApp = `${this.stage}/${this.stack}/${appName}`;

		const acmCertificate = new acm.Certificate(
			this,
			`cloudfront-certificate-${this.stage}`,
			{
				domainName: props.domainName,
				validation: acm.CertificateValidation.fromDns(),
			},
		);

		// write the certificate ARN to an SSM parameter so it can be used in other stacks
		new StringParameter(this, 'CloudFrontCertificateArn', {
			stringValue: acmCertificate.certificateArn,
			parameterName: `/${stageStackApp}/cloudfront/certificateArn`,
			description: `The ARN of the CloudFront certificate for ${props.domainName}, for consumption by the Newswires app stack.`,
		});
	}
}
