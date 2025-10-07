import type { PutObjectCommandOutput } from '@aws-sdk/client-s3';
import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { getFromEnv, isRunningLocally } from './config';
import { getErrorMessage } from './getErrorMessage';
import { createLogger } from './lambda-logging';
import type { OperationResult } from './types';

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

const s3Client = new S3Client(awsOptions);

const logger = createLogger({});

export async function getFromS3({
	bucketName,
	key,
}: {
	bucketName: string;
	key: string;
}): Promise<OperationResult<{ body: string, lastModified?: Date }>> {
	logger.log({
		message: `Getting object from S3 bucket "${bucketName}" with key "${key}"`,
		key,
		bucketName,
	});
	try {
		const response = await s3Client.send(
			new GetObjectCommand({
				Bucket: bucketName,
				Key: key,
			}),
		);
		const body = await response.Body?.transformToString();
		const lastModified = response.LastModified;
		if (body) {
			return { status: 'success', body, lastModified };
		} else {
			return {
				status: 'failure',
				reason: 'No body found in S3 response',
			};
		}
	} catch (caught) {
		return {
			status: 'failure',
			reason: getErrorMessage(caught),
		};
	}
}

export async function putToS3({
	bucketName,
	key,
	body,
}: {
	bucketName: string;
	key: string;
	body: string | Buffer;
}): Promise<OperationResult<{ response: PutObjectCommandOutput }>> {
	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		Body: body,
	});
	logger.log({
		message: `Putting object to S3 bucket "${bucketName}" with key "${key}"`,
		key,
		bucketName,
	});
	try {
		const response = await s3Client.send(command);
		return { status: 'success', response };
	} catch (caught) {
		return {
			status: 'failure',
			reason: getErrorMessage(caught),
		};
	}
}

export const FEEDS_BUCKET_NAME: string = isRunningLocally
	? 'local-feeds-bucket'
	: getFromEnv('FEEDS_BUCKET_NAME');
