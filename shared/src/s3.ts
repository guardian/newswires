import type { PutObjectCommandOutput } from '@aws-sdk/client-s3';
import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { getErrorMessage } from '@guardian/libs';
import { appConfig } from './config';
import { createLogger } from './lambda-logging';
import type { OperationResult } from './types';

const { appMode, awsConfig } = appConfig;

const logger = createLogger({});

interface FileService {
	putToS3({
		bucketName,
		key,
		body,
	}: {
		bucketName: string;
		key: string;
		body: string | Buffer;
	}): Promise<OperationResult<{ response: PutObjectCommandOutput }>>;
	getFromS3({
		bucketName,
		key,
	}: {
		bucketName: string;
		key: string;
	}): Promise<OperationResult<{ body: string; lastModified?: Date }>>;
}

class S3Service implements FileService {
	s3Client: S3Client;

	constructor(s3Client: S3Client) {
		this.s3Client = s3Client;
	}

	async putToS3({
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
			const response = await this.s3Client.send(command);
			return { status: 'success', response };
		} catch (caught) {
			return {
				status: 'failure',
				reason: getErrorMessage(caught),
			};
		}
	}

	async getFromS3({
		bucketName,
		key,
	}: {
		bucketName: string;
		key: string;
	}): Promise<OperationResult<{ body: string; lastModified?: Date }>> {
		logger.log({
			message: `Getting object from S3 bucket "${bucketName}" with key "${key}"`,
			key,
			bucketName,
		});
		try {
			const response = await this.s3Client.send(
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
}

class InMemoryFileService implements FileService {
	private store: Map<string, { body: string; lastModified: Date }>;

	constructor() {
		this.store = new Map();
	}

	async putToS3({
		bucketName,
		key,
		body,
	}: {
		bucketName: string;
		key: string;
		body: string | Buffer;
	}): Promise<OperationResult<{ response: PutObjectCommandOutput }>> {
		const now = new Date();
		const bodyStr = typeof body === 'string' ? body : body.toString();
		this.store.set(key, { body: bodyStr, lastModified: now });
		logger.log({
			message: `Putting object to InMemory bucket "${bucketName}" with key "${key}"`,
			key,
			bucketName,
		});
		const response: PutObjectCommandOutput = {
			$metadata: { httpStatusCode: 200 },
		};
		return Promise.resolve({ status: 'success', response });
	}

	async getFromS3({
		bucketName,
		key,
	}: {
		bucketName: string;
		key: string;
	}): Promise<OperationResult<{ body: string; lastModified?: Date }>> {
		logger.log({
			message: `Getting object from InMemory bucket "${bucketName}" with key "${key}"`,
			key,
			bucketName,
		});
		const entry = this.store.get(key);
		if (entry) {
			return Promise.resolve({
				status: 'success',
				body: entry.body,
				lastModified: entry.lastModified,
			});
		} else {
			return Promise.resolve({
				status: 'failure',
				reason: 'No body found in InMemoryFileService store',
			});
		}
	}
}

export const fileService =
	appMode === 'dev'
		? new InMemoryFileService()
		: new S3Service(new S3Client(awsConfig));
