import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@smithy/types';

type AppMode = 'dev' | 'code' | 'prod';
const allowedAppModes: readonly AppMode[] = ['dev', 'code', 'prod'];
function isAppMode(value: string): value is AppMode {
	return allowedAppModes.includes(value as AppMode);
}
const APP_MODE = (() => {
	const stageEnv = getOptionalFromEnv('STAGE');
	if (!stageEnv) return 'dev';
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

type AwsConfig =
	| {
			appMode: 'dev';
			awsConfig: undefined;
	  }
	| {
			appMode: 'code' | 'prod';
			awsConfig: {
				region: string;
				credentials: AwsCredentialIdentityProvider;
			};
	  };

function buildAwsConfig(): AwsConfig {
	switch (APP_MODE) {
		case 'dev': {
			return {
				appMode: 'dev',
				awsConfig: undefined,
			};
		}
		case 'code':
		case 'prod': {
			return {
				appMode: APP_MODE,
				awsConfig: awsConfig,
			};
		}
	}
}
type ResourceConfig = {
	resource: string;
};

function buildResourceConfig(envVariable: string): ResourceConfig {
	switch (APP_MODE) {
		case 'dev': {
			return {
				resource: getOptionalFromEnv(envVariable) ?? '',
			};
		}
		case 'code':
		case 'prod': {
			return {
				resource: getFromEnv(envVariable),
			};
		}
	}
}

type DatabaseConfig =
	| {
			appMode: 'dev';
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
		case 'dev': {
			return {
				appMode: 'dev',
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

export const appConfig = buildAwsConfig();
export const databaseConfig = buildDatabaseConfig();
export const ingestionQueueUrl = buildResourceConfig(
	'INGESTION_LAMBDA_QUEUE_URL',
).resource;
export const feedsBucket = buildResourceConfig('FEEDS_BUCKET_NAME').resource;
export const emailBucket = buildResourceConfig('EMAIL_BUCKET_NAME').resource;
