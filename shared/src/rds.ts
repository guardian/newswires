import { Signer } from '@aws-sdk/rds-signer';
import postgres from 'postgres';
import { databaseConfig } from './config';

const { port, hostname, username } = databaseConfig;

const signer = new Signer({
	port,
	hostname,
	username,
});

export async function initialiseDbConnection() {
	const token = databaseConfig.password ?? (await signer.getAuthToken());

	const sql = postgres({
		...databaseConfig,
		password: token,
		idle_timeout: 10,
		max_lifetime: 60 * 15, // todo -- import from cdk max lambda timeout config?
	});

	async function closeDbConnection() {
		await sql.end();
	}
	return {
		sql,
		closeDbConnection,
	};
}
