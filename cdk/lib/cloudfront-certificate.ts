import { GuStack, type GuStackProps } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
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

		new acm.Certificate(this, `cloudfront-certificate-${this.stage}`, {
			domainName: props.domainName,
			validation: acm.CertificateValidation.fromDns(),
		});
	}
}
