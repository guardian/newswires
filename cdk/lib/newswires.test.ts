import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NewsWires } from './newswires';

describe('The NewsWires stack', () => {
	it('matches the snapshot', () => {
		const app = new App();
		const stack = new NewsWires(app, 'NewsWires', {
			stack: 'editorial-feeds',
			stage: 'TEST',
      domainName: 'newswires.TEST.dev-gutools.co.uk',
      enableMonitoring: true,
		});
		const template = Template.fromStack(stack);
		expect(template.toJSON()).toMatchSnapshot();
	});
});
