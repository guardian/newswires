import 'source-map-support/register';
import { WiresFeeds } from '../lib/wires-feeds';
import { Newswires } from '../lib/newswires';
import { App } from 'aws-cdk-lib';
import { RiffRaffYamlFile } from '@guardian/cdk/lib/riff-raff-yaml-file';

const app = new App();

// FIXME we should probably have a dedicated stack for the Newswires app for e.g. cost explorer purposes (as the App tag needs to be different for riff-raff etc. to differentiate)
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

export const riffraff = new RiffRaffYamlFile(app);

riffraff.synth();
