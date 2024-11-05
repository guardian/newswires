import 'source-map-support/register';
import { WiresFeeds } from '../lib/wires-feeds';
import { Newswires } from '../lib/newswires';
import { App } from 'aws-cdk-lib';
import { RiffRaffYamlFile } from '@guardian/cdk/lib/riff-raff-yaml-file';
import { POLLERS_CONFIG } from '../../shared/pollers';
import { POLLER_LAMBDA_APP_SUFFIX } from '../lib/constructs/pollerLambda';

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
	sourceQueue: codeWiresFeeds.sourceQueue,
	fingerpostQueue: codeWiresFeeds.fingerpostQueue,
}).addDependency(codeWiresFeeds);

new Newswires(app, 'Newswires-PROD', {
	env,
	stack,
	stage: 'PROD',
	domainName: 'newswires.gutools.co.uk',
	enableMonitoring: false,
	sourceQueue: prodWiresFeeds.sourceQueue,
	fingerpostQueue: prodWiresFeeds.fingerpostQueue,
}).addDependency(prodWiresFeeds);

export const riffraff = new RiffRaffYamlFile(app);

const pollerLambdaIds = Object.keys(POLLERS_CONFIG).map(
	(pollerId) => `${pollerId}${POLLER_LAMBDA_APP_SUFFIX}`,
);
riffraff.riffRaffYaml.deployments.forEach((deployment, key) => {
	if (
		deployment.type === 'aws-lambda' &&
		pollerLambdaIds.includes(deployment.app)
	) {
		deployment.contentDirectory = 'poller-lambdas';
	}
});

riffraff.synth();
