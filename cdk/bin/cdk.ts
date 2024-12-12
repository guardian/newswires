import 'source-map-support/register';
import { RiffRaffYamlFile } from '@guardian/cdk/lib/riff-raff-yaml-file';
import { App } from 'aws-cdk-lib';
import { STACK } from '../../shared/constants';
import type { PollerId } from '../../shared/pollers';
import { pollerIdToLambdaAppName, POLLERS_CONFIG } from '../../shared/pollers';
import { Newswires } from '../lib/newswires';
import { WiresFeeds } from '../lib/wires-feeds';

const app = new App();

const env = {
	region: 'eu-west-1',
};

const codeWiresFeeds = new WiresFeeds(app, 'WiresFeeds-CODE', {
	env,
	stack: STACK,
	stage: 'CODE',
});

const prodWiresFeeds = new WiresFeeds(app, 'WiresFeeds-PROD', {
	env,
	stack: STACK,
	stage: 'PROD',
});

new Newswires(app, 'Newswires-CODE', {
	env,
	stack: STACK,
	stage: 'CODE',
	domainName: 'newswires.code.dev-gutools.co.uk',
	enableMonitoring: false,
	sourceQueue: codeWiresFeeds.sourceQueue,
	fingerpostQueue: codeWiresFeeds.fingerpostQueue,
}).addDependency(codeWiresFeeds);

new Newswires(app, 'Newswires-PROD', {
	env,
	stack: STACK,
	stage: 'PROD',
	domainName: 'newswires.gutools.co.uk',
	enableMonitoring: false,
	sourceQueue: prodWiresFeeds.sourceQueue,
	fingerpostQueue: prodWiresFeeds.fingerpostQueue,
}).addDependency(prodWiresFeeds);

export const riffraff = new RiffRaffYamlFile(app);

const pollerLambdaIds = (Object.keys(POLLERS_CONFIG) as PollerId[]).map(
	pollerIdToLambdaAppName,
);
riffraff.riffRaffYaml.deployments.forEach((deployment) => {
	if (
		deployment.type === 'aws-lambda' &&
		pollerLambdaIds.includes(deployment.app)
	) {
		deployment.contentDirectory = 'poller-lambdas';
	}
});

riffraff.synth();
