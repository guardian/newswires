import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack } from '@guardian/cdk/lib/constructs/core';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Newswires } from './newswires';

class MockWiresFeedsStack extends GuStack {
	public readonly mockSourceQueue: Queue;
	public readonly mockFingerpostQueue: Queue;
	public readonly mockSnsTopic: Topic;
	constructor(scope: App, id: string, props: GuStackProps) {
		super(scope, id, props);
		this.mockSourceQueue = new Queue(this, 'MockSourceQueue');
		this.mockFingerpostQueue = new Queue(this, 'MockFingerpostQueue');
		this.mockSnsTopic = new Topic(this, 'MockSnsTopic');
	}
}

describe('The Newswires stack', () => {
	it('matches the snapshot', () => {
		const app = new App();

		const { mockFingerpostQueue, mockSourceQueue, mockSnsTopic } =
			new MockWiresFeedsStack(app, 'mockWiresFeeds', {
				stack: 'editorial-feeds',
				stage: 'TEST',
			});

		const stack = new Newswires(app, 'Newswires', {
			stack: 'editorial-feeds',
			stage: 'TEST',
			domainName: 'newswires.TEST.dev-gutools.co.uk',
			enableMonitoring: true,
			fingerpostQueue: mockFingerpostQueue,
			sourceQueue: mockSourceQueue,
			alarmSnsTopic: mockSnsTopic,
		});
		const template = Template.fromStack(stack);
		expect(template.toJSON()).toMatchSnapshot();
	});
});
