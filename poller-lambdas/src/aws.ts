import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { POLLER_LAMBDA_ENV_VAR_KEYS } from 'newswires-shared/pollers';
import { sqs } from 'newswires-shared/sqs';
import { getEnvironmentVariableOrCrash, remoteAwsConfig } from './config';

export const secretsManager = new SecretsManagerClient(remoteAwsConfig);

export const queueNextInvocation = (props: {
	MessageBody: string;
	DelaySeconds?: number;
}) =>
	sqs.send(
		new SendMessageCommand({
			QueueUrl: getEnvironmentVariableOrCrash(
				POLLER_LAMBDA_ENV_VAR_KEYS.OWN_QUEUE_URL,
			),
			...props,
		}),
	);
