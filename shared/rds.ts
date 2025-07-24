import { Signer } from '@aws-sdk/rds-signer';
import postgres from 'postgres';
import { isRunningLocally } from './config';
import {
	DATABASE_ENDPOINT_ADDRESS,
	DATABASE_NAME,
	DATABASE_PORT,
	DATABASE_USERNAME,
} from './DATABASE_NAME';

const sharedConfig = {
	port: DATABASE_PORT,
	hostname: DATABASE_ENDPOINT_ADDRESS,
	username: DATABASE_USERNAME,
};

const signer = new Signer(sharedConfig);

export async function createDbConnection() {
	const token = isRunningLocally ? 'postgres' : await signer.getAuthToken();
	const ssl = isRunningLocally ? 'prefer' : 'require';

	return postgres({
		...sharedConfig,
		database: DATABASE_NAME,
		password: token,
		ssl,
		idle_timeout: 10,
		max_lifetime: 60 * 15, // todo -- import from cdk max lambda timeout config?
	});
}
