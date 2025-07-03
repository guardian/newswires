import { getFromEnv, isRunningLocally } from './config';

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
