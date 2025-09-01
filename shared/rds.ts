import { Signer } from '@aws-sdk/rds-signer';
import postgres, { Sql } from 'postgres';
import { getFromEnv, isRunningLocally } from './config';
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";

import { fromIni } from '@aws-sdk/credential-providers';
import { sign } from 'crypto';

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

const sharedConfig = {
	port: DATABASE_PORT,
	hostname: DATABASE_ENDPOINT_ADDRESS,
	username: DATABASE_USERNAME,
};
const region: string = "eu-west-1"; // Example region

// Load credentials from a specific profile
const credentials = fromIni({ profile: "editorial-feeds" });
const ssmConnect = async () => {

    const stack = "editorial-feeds"
    const stage = "CODE"
    const app = "newswires"
    const ssa = `/${stage}/${stack}/${app}`
	const PARAMETER_NAMES = [
		`${ssa}/database/username`,
		`${ssa}/database/port`,      // optional if you're handling secrets elsewhere
		`${ssa}/database/endpoint-address`,
		`${ssa}/database/database-name`
		];
	const command = new GetParametersCommand({
    	Names: PARAMETER_NAMES,
  	});
	// Create SSM client
	const ssmClient = new SSMClient({
		region,
		credentials
	});

	const response = await ssmClient.send(command);

	const paramMap: Record<string, string> = {};

	response.Parameters?.forEach(param => {
		if (param.Name && param.Value) {
			// Remove the prefix from the parameter name
			const paramName = param.Name.replace(`${ssa}/database/`, '');
			paramMap[paramName] = param.Value;
		
		}
	});
	return paramMap;
};

export async function initialiseDbConnection(useSSM: boolean=false) {
	let sql: Sql;

	if(useSSM) {
		const ssmParameters = await ssmConnect();
		const signer = new Signer({region, credentials, 
			...{
				username: ssmParameters['username'] || '',
				port:  parseInt(ssmParameters['port'] || '5432'),
				hostname: ssmParameters['endpoint-address'] || '' // this is the endpoint name in parameter store
			},
		});
		const token = await signer.getAuthToken(); // this using iam to get a temporary password
		// then run a tunnel to forward localhost to the RDS instance
		sql = postgres({
			...{
				username: ssmParameters['username'] || '',
				port:  parseInt(ssmParameters['port'] || '5432'),
				hostname: 'localhost', // this is matching the local tunnel
				database: ssmParameters['database-name'] || DATABASE_NAME,
			},
			password: token, // use temporary password here
			ssl: 'require',
			idle_timeout: 10,
			max_lifetime: 60 * 15, // todo -- import from cdk max lambda timeout config?
		});
		// Use SSM parameters to configure the database connection
	}
	else {
		const signer = new Signer(sharedConfig);
		const token = isRunningLocally ? 'postgres' : await signer.getAuthToken();
		const ssl = isRunningLocally ? 'prefer' : 'require';
		sql = postgres({
			...sharedConfig,
			database: DATABASE_NAME,
			password: token,
			ssl,
			idle_timeout: 10,
			max_lifetime: 60 * 15, // todo -- import from cdk max lambda timeout config?
		});
	}
	
	

	async function closeDbConnection() {
		await sql.end();
	}
	return {
		sql,
		closeDbConnection,
	};
}
