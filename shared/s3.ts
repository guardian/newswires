import { S3Client } from '@aws-sdk/client-s3';
import { getFromEnv, isRunningLocally } from './config';

// We use localstack to mock AWS services if we are running locally.
const awsOptions = isRunningLocally
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

export const s3Client = new S3Client(awsOptions);

export const BUCKET_NAME: string = isRunningLocally
	? 'local-feeds-bucket'
	: getFromEnv('FEEDS_BUCKET_NAME');
