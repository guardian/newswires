/**
 * Is this application running locally, or in AWS?
 * LAMBDA_TASK_ROOT & AWS_EXECUTION_ENV are set when running in AWS
 * See: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
 */
export const isRunningLocally =
	!process.env.LAMBDA_TASK_ROOT && !process.env.AWS_EXECUTION_ENV;

// We use localstack to mock AWS services if we are running locally.
export const awsOptions = isRunningLocally
	? {
			endpoint: 'http://localhost:4566',
			region: 'eu-west-1',
			forcePathStyle: true,
			credentials: {
				accessKeyId: '',
				secretAccessKey: '',
			},
		}
	: {};

export const BUCKET_NAME: string = isRunningLocally
	? 'local-feeds-bucket'
	: getFromEnv('FEEDS_BUCKET_NAME');

export const DATABASE_NAME: string = isRunningLocally
	? 'newswires'
	: getFromEnv('DATABASE_NAME');

export const DATABASE_ENDPOINT_ADDRESS: string = isRunningLocally
	? 'localhost'
	: getFromEnv('DATABASE_ENDPOINT_ADDRESS');

export const DATABASE_PORT: number = isRunningLocally
	? 5432
	: parseInt(getFromEnv('DATABASE_PORT'));

export const DATABASE_USERNAME = 'postgres';

function getFromEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable ${key}`);
	}
	return value;
}
