import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WiresFeeds } from './wires-feeds';

describe('The WiresFeeds stack', () => {
	it('matches the snapshot', () => {
		const app = new App();
		const stack = new WiresFeeds(app, 'WiresFeeds', {
			stack: 'editorial-feeds',
			stage: 'TEST',
		});
		const template = Template.fromStack(stack);
		expect(template.toJSON()).toMatchSnapshot();
	});
});
