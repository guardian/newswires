import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@smithy/types';

const allowedAppModes = ['dev', 'code', 'prod'] as const;
type AppMode = (typeof allowedAppModes)[number];
function isAppMode(value: string): value is AppMode {
	return allowedAppModes.includes(value as AppMode);
}
const APP_MODE = (() => {
	const stageEnv = env('STAGE').orElse('dev');
	const stage = stageEnv.toLowerCase();
	if (!isAppMode(stage))
		throw new Error(
			`Invalid stage, ${stage}. Allowed values are ${allowedAppModes.join(', ')}`,
		);
	return stage;
})();

function env(key: string) {
	return {
		required(): string {
			const value = process.env[key];
			if (!value) {
				throw new Error(`Missing required environment variable ${key}`);
			}
			return value;
		},
		orElse(defaultValue: string): string {
			return process.env[key] ?? defaultValue;
		},
	};
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
				port: parseInt(env('DATABASE_PORT').required()),
				username: 'postgres',
				hostname: env('DATABASE_ENDPOINT_ADDRESS').required(),
				name: env('DATABASE_NAME').required(),
				ssl: 'require',
				password: undefined,
			};
		}
	}
}

export const appConfig = buildAwsConfig();
export const databaseConfig = () => buildDatabaseConfig();
export const ingestionQueueUrl = () =>
	APP_MODE === 'dev'
		? env('INGESTION_LAMBDA_QUEUE_URL').orElse('dummy-ingestion-queue')
		: env('INGESTION_LAMBDA_QUEUE_URL').required();
export const feedsBucket = () =>
	APP_MODE === 'dev'
		? env('FEEDS_BUCKET_NAME').orElse('dummy-feeds-bucket')
		: env('FEEDS_BUCKET_NAME').required();
export const emailBucket = () =>
	APP_MODE === 'dev'
		? env('EMAIL_BUCKET_NAME').orElse('dummy-email-bucket')
		: env('EMAIL_BUCKET_NAME').required();
