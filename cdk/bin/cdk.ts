import 'source-map-support/register';
import { GuRoot } from '@guardian/cdk/lib/constructs/root';
import { WiresFeeds } from '../lib/wires-feeds';
import { Newswires } from '../lib/newswires';

const app = new GuRoot();

const stack = 'editorial-feeds';

const env = {
	region: 'eu-west-1',
};

const codeWiresFeeds = new WiresFeeds(app, 'WiresFeeds-CODE', {
	env,
	stack,
	stage: 'CODE',
});

const prodWiresFeeds = new WiresFeeds(app, 'WiresFeeds-PROD', {
	env,
	stack,
	stage: 'PROD',
});

new Newswires(app, 'Newswires-CODE', {
	env,
	stack,
	stage: 'CODE',
	domainName: 'newswires.code.dev-gutools.co.uk',
	enableMonitoring: false,
	fingerpostQueue: codeWiresFeeds.fingerpostQueue,
});

new Newswires(app, 'Newswires-PROD', {
	env,
	stack,
	stage: 'PROD',
	domainName: 'newswires.gutools.co.uk',
	enableMonitoring: false,
	fingerpostQueue: prodWiresFeeds.fingerpostQueue,
});
