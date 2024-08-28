import { S3Client } from '@aws-sdk/client-s3';
import { awsOptions } from './config';

export const s3Client = new S3Client(awsOptions);

/**
 * The location of an object in S3
 *
 * Provides an abstraction over the S3 bucket and object key,
 * so we don't have to reach into the AWS SDK to get the values in tests,
 * and prevents us from having to use the capitalized property names.
 *
 * @param bucketName The name of the bucket
 * @param objectKey The key of the object
 **/
export type ObjectLocation = {
	bucketName: string;
	objectKey: string;
};
