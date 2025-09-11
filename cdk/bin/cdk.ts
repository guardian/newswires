import { RiffRaffYamlFile } from '@guardian/cdk/lib/riff-raff-yaml-file';
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import type { Topic } from 'aws-cdk-lib/aws-sns';
import type { Queue } from 'aws-cdk-lib/aws-sqs';
import { STACK } from '../../shared/constants';
import type { PollerId } from '../../shared/pollers';
import { pollerIdToLambdaAppName, POLLERS_CONFIG } from '../../shared/pollers';
import { NewswiresCloudfrontCertificate } from '../lib/cloudfront-certificate';
import { Newswires } from '../lib/newswires';
import { WiresFeeds } from '../lib/wires-feeds';

const app = new App();

const env = {
	region: 'eu-west-1',
};

type SharedStackProps = {
	app: App;
	stack: string;
	stage: string;
	domainName: string;
	enableMonitoring: boolean;
};

function createNewswiresStack({
	app,
	stack,
	stage,
	domainName,
	enableMonitoring,
	sourceQueue,
	fingerpostQueue,
	alarmSnsTopic,
}: SharedStackProps & {
	sourceQueue: Queue;
	fingerpostQueue: Queue;
	alarmSnsTopic: Topic;
}) {
	return new Newswires(app, `Newswires-${stage}`, {
		env,
		stack,
		stage,
		domainName,
		enableMonitoring,
		sourceQueue,
		fingerpostQueue,
		alarmSnsTopic,
	});
}

export function createStacks({
	app,
	stack,
	stage,
	domainName,
	enableMonitoring,
}: SharedStackProps) {
	const wiresFeedsStack = new WiresFeeds(app, `WiresFeeds-${stage}`, {
		env,
		stack,
		stage,
	});

	const newswiresStack = createNewswiresStack({
		app,
		stack,
		stage,
		domainName,
		enableMonitoring,
		sourceQueue: wiresFeedsStack.sourceQueue,
		fingerpostQueue: wiresFeedsStack.fingerpostQueue,
		alarmSnsTopic: wiresFeedsStack.alarmSnsTopic,
	});

	const cloudfrontCertificateStack = new NewswiresCloudfrontCertificate(
		app,
		`NewswiresCloudFrontCertificate-${stage}`,
		{
			stack,
			stage,
			domainName,
		},
	);

	newswiresStack.addDependency(wiresFeedsStack);
	newswiresStack.addDependency(cloudfrontCertificateStack);

	return {
		wiresFeedsStack,
		newswiresStack,
		cloudfrontCertificateStack,
	};
}

createStacks({
	app,
	stack: STACK,
	stage: 'CODE',
	domainName: 'newswires.code.dev-gutools.co.uk',
	enableMonitoring: false,
});
createStacks({
	app,
	stack: STACK,
	stage: 'PROD',
	domainName: 'newswires.gutools.co.uk',
	enableMonitoring: true,
});

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
