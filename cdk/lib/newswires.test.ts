import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack } from '@guardian/cdk/lib/constructs/core';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Newswires, NewswiresCloudFrontCertificate } from './newswires';

class MockWiresFeedsStack extends GuStack {
	public readonly mockSourceQueue: Queue;
	public readonly mockFingerpostQueue: Queue;
	constructor(scope: App, id: string, props: GuStackProps) {
		super(scope, id, props);
		this.mockSourceQueue = new Queue(this, 'MockSourceQueue');
		this.mockFingerpostQueue = new Queue(this, 'MockFingerpostQueue');
	}
}

describe('The Newswires stack', () => {
	it('matches the snapshot', () => {
		const app = new App();

		const { mockFingerpostQueue, mockSourceQueue } = new MockWiresFeedsStack(
			app,
			'mockWiresFeeds',
			{
				stack: 'editorial-feeds',
				stage: 'TEST',
				env: {
					region: 'eu-west-1',
				},
			},
		);

		const cloudfrontStack = new NewswiresCloudFrontCertificate(
			app,
			'NewswiresCloudFrontCertificate',
			{
				stack: 'editorial-feeds',
				stage: 'TEST',
				domainName: 'newswires.TEST.dev-gutools.co.uk',
				env: { region: 'us-east-1' },
			},
		);
		const stack = new Newswires(app, 'Newswires', {
			stack: 'editorial-feeds',
			stage: 'TEST',
			domainName: 'newswires.TEST.dev-gutools.co.uk',
			enableMonitoring: true,
			fingerpostQueue: mockFingerpostQueue,
			sourceQueue: mockSourceQueue,
			certificateArn: cloudfrontStack.certificateArn,
			env: {
				region: 'eu-west-1',
			},
		});

		const newswiresStackTemplate = Template.fromStack(stack);
		expect(newswiresStackTemplate.toJSON()).toMatchSnapshot();
	});
});
