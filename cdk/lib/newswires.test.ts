import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Newswires } from './newswires';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { GuStack, GuStackProps } from '@guardian/cdk/lib/constructs/core';

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
			{ stack: 'editorial-feeds', stage: 'TEST' },
		);

		const stack = new Newswires(app, 'Newswires', {
			stack: 'editorial-feeds',
			stage: 'TEST',
			domainName: 'newswires.TEST.dev-gutools.co.uk',
			enableMonitoring: true,
			fingerpostQueue: mockFingerpostQueue,
			sourceQueue: mockSourceQueue,
		});
		const template = Template.fromStack(stack);
		expect(template.toJSON()).toMatchSnapshot();
	});
});
