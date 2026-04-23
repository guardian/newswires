import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@smithy/types';

type AppMode = 'local' | 'dev' | 'code' | 'prod';
const allowedAppModes: readonly AppMode[] = ['local', 'dev', 'code', 'prod'];
function isAppMode(value: string): value is AppMode {
	return allowedAppModes.includes(value as AppMode);
}
const APP_MODE = (() => {
	const stageEnv = getOptionalFromEnv('STAGE');
	if (!stageEnv) return 'local';
	const stage = stageEnv.toLowerCase();
	if (!isAppMode(stage))
		throw new Error(
			`Invalid stage, ${stage}. Allowed values are ${allowedAppModes.join(', ')}`,
		);
	return stage;
})();

function getFromEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable ${key}`);
	}
	return value;
}

function getOptionalFromEnv(key: string): string | undefined {
	return process.env[key];
}

const awsConfig = {
	region: 'eu-west-1',
	credentials: fromNodeProviderChain({
		profile: 'editorial-feeds',
	}),
};

type AppConfig =
	| {
			queueUrl: string;
			feedsBucket: string;
			emailBucket: string;
			appMode: 'local';
			awsConfig: undefined;
	  }
	| {
			queueUrl: string;
			feedsBucket: string;
			emailBucket: string;
			appMode: 'dev' | 'code' | 'prod';
			awsConfig: {
				region: string;
				credentials: AwsCredentialIdentityProvider;
			};
	  };

function buildAppConfig(): AppConfig {
	switch (APP_MODE) {
		case 'local': {
			return {
				queueUrl: getOptionalFromEnv('INGESTION_LAMBDA_QUEUE_URL') ?? '',
				feedsBucket: getOptionalFromEnv('FEEDS_BUCKET_NAME') ?? '',
				emailBucket: getOptionalFromEnv('EMAIL_BUCKET_NAME') ?? '',
				appMode: 'local',
				awsConfig: undefined,
			};
		}
		case 'dev':
		case 'code':
		case 'prod': {
			return {
				queueUrl: getFromEnv('INGESTION_LAMBDA_QUEUE_URL'),
				feedsBucket: getFromEnv('FEEDS_BUCKET_NAME'),
				emailBucket: getFromEnv('EMAIL_BUCKET_NAME'),
				appMode: APP_MODE,
				awsConfig: awsConfig,
			};
		}
	}
}

type DatabaseConfig =
	| {
			appMode: 'local' | 'dev';
			port: number;
			username: string;
			hostname: string;
			name: string;
			ssl: 'prefer';
			password: string;
	  }
	| {
			appMode: 'code' | 'prod';
			port: number;
			username: string;
			hostname: string;
			name: string;
			ssl: 'require';
			password: undefined;
	  };

function buildDatabaseConfig(): DatabaseConfig {
	switch (APP_MODE) {
		case 'local':
		case 'dev': {
			return {
				appMode: APP_MODE,
				port: 5432,
				username: 'postgres',
				hostname: 'localhost',
				name: 'newswires',
				ssl: 'prefer',
				password: 'postgres',
			};
		}
		case 'code':
		case 'prod': {
			return {
				appMode: APP_MODE,
				port: parseInt(getFromEnv('DATABASE_PORT')),
				username: 'postgres',
				hostname: getFromEnv('DATABASE_ENDPOINT_ADDRESS'),
				name: getFromEnv('DATABASE_NAME'),
				ssl: 'require',
				password: undefined,
			};
		}
	}
}

export const appConfig = buildAppConfig();
export const databaseConfig = buildDatabaseConfig();
