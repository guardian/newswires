import 'source-map-support/register';
import { GuRoot } from '@guardian/cdk/lib/constructs/root';
import { WiresFeeds } from '../lib/wires-feeds';
import { NewsWires } from '../lib/newswires';

const app = new GuRoot();

const stack = 'editorial-feeds';

const env = {
	region: 'eu-west-1',
};

new WiresFeeds(app, 'WiresFeeds-CODE', {
	env,
	stack,
	stage: 'CODE',
});
new WiresFeeds(app, 'WiresFeeds-PROD', {
	env,
	stack,
	stage: 'PROD',
});

new NewsWires(app, 'NewsWires-CODE', {
	env,
	stack,
	stage: 'CODE',
	domainName: 'newswires.code.dev-gutools.co.uk',
	enableMonitoring: false,
});
