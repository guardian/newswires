import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NewswiresCloudfrontCertificate } from './cloudfront-certificate';

describe('NewswiresCloudFrontCertificate', () => {
	it('matches the snapshot', () => {
		const app = new App();

		const stack = new NewswiresCloudfrontCertificate(
			app,
			'NewswiresCloudFrontCertificateTest',
			{
				stack: 'editorial-feeds',
				stage: 'TEST',
				domainName: 'newswires.TEST.dev-gutools.co.uk',
				env: { region: 'us-east-1' },
			},
		);

		const template = Template.fromStack(stack);
		expect(template.toJSON()).toMatchSnapshot();
	});
});
