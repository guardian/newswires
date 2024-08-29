import { Alarms, GuPlayApp } from '@guardian/cdk';
import { AccessScope } from '@guardian/cdk/lib/constants';
import type { NoMonitoring } from '@guardian/cdk/lib/constructs/cloudwatch';
import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuParameter, GuStack } from '@guardian/cdk/lib/constructs/core';
import { GuGetS3ObjectsPolicy } from '@guardian/cdk/lib/constructs/iam/index.js';
import { type App } from 'aws-cdk-lib';
import { InstanceType, InstanceClass, InstanceSize } from 'aws-cdk-lib/aws-ec2';
import { Topic } from 'aws-cdk-lib/aws-sns';

type Props = GuStackProps & {
	domainName: string;
	enableMonitoring: boolean;
};

export class NewsWires extends GuStack {
	constructor(scope: App, id: string, props: Props) {
		super(scope, id, props);

		const { domainName, enableMonitoring } = props;

		const stage = this.stage;
		const stack = this.stack;

		const appName = 'newswires';

		const panDomainSettingsBucket = new GuParameter(
			this,
			'PanDomainSettingsBucket',
			{
				description: 'Bucket name for pan-domain auth settings',
				fromSSM: true,
				default: `/${stage}/${stack}/${appName}/pan-domain-settings-bucket`,
				type: 'String',
			},
		);

		const alarmSnsTopic = new Topic(this, `${appName}-email-alarm-topic`);

		const scaling = {
			minimumInstances: 1,
			maximumInstances: 2,
		};

		const monitoringConfiguration: Alarms | NoMonitoring = enableMonitoring
			? {
					snsTopicName: alarmSnsTopic.topicName,
					unhealthyInstancesAlarm: true,
					http5xxAlarm: {
						tolerated5xxPercentage: 10,
						numberOfMinutesAboveThresholdBeforeAlarm: 1,
					},
				}
			: { noMonitoring: true };

		new GuPlayApp(this, {
			app: appName,
			access: { scope: AccessScope.PUBLIC },
			instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.SMALL),
			certificateProps: {
				domainName,
			},
			monitoringConfiguration,
			userData: {
				distributable: {
					fileName: `${appName}.deb`,
					executionStatement: `dpkg -i /${appName}/${appName}.deb`,
				},
			},
			scaling,
			applicationLogging: { enabled: true, systemdUnitName: appName },
			imageRecipe: 'editorial-tools-focal-java17-ARM-WITH-cdk-base',
			roleConfiguration: {
				additionalPolicies: [
					new GuGetS3ObjectsPolicy(this, 'PandaAuthPolicy', {
						bucketName: panDomainSettingsBucket.valueAsString,
					}),
				],
			},
		});
	}
}
