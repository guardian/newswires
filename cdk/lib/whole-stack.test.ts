import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { createStacks } from '../bin/cdk';

describe('createStacks', () => {
	it('should create WiresFeeds and Newswires stacks with correct properties', () => {
		const app = new App();
		const stackProps = {
			app,
			stack: 'editorial-feeds',
			stage: 'TEST',
			domainName: 'newswires.TEST.dev-gutools.co.uk',
			enableMonitoring: true,
		};

		const { wiresFeedsStack, newswiresStack, cloudfrontCertificateStack } =
			createStacks({
				...stackProps,
			});

		const wiresFeedsTemplate = Template.fromStack(wiresFeedsStack);
		expect(wiresFeedsTemplate.toJSON()).toMatchSnapshot();
		const newswiresTemplate = Template.fromStack(newswiresStack);
		expect(newswiresTemplate.toJSON()).toMatchSnapshot();
		const cloudfrontCertificateTemplate = Template.fromStack(
			cloudfrontCertificateStack,
		);
		expect(cloudfrontCertificateTemplate.toJSON()).toMatchSnapshot();
	});
});
