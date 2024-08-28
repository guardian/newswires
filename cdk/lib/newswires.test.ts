import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Newswires } from './newswires';

describe('The Newswires stack', () => {
	it('matches the snapshot', () => {
		const app = new App();
		const stack = new Newswires(app, 'Newswires', {
			stack: 'editorial-feeds',
			stage: 'TEST',
		});
		const template = Template.fromStack(stack);
		expect(template.toJSON()).toMatchSnapshot();
	});
});
