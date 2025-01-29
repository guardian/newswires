/**
 * Is this application running locally, or in AWS?
 * LAMBDA_TASK_ROOT & AWS_EXECUTION_ENV are set when running in AWS
 * See: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
 */
export const isRunningLocally =
	!process.env.LAMBDA_TASK_ROOT && !process.env.AWS_EXECUTION_ENV;

export const TABLE_NAME = 'fingerpost_wire_entry';

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
