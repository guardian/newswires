import { S3Client } from '@aws-sdk/client-s3';
import { awsOptions } from './config';

export const s3Client = new S3Client(awsOptions);
