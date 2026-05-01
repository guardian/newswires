import { getErrorMessage } from '@guardian/libs';
import { fileService } from 'newswires-shared/s3';
import type { OperationResult } from 'newswires-shared/types';

export async function getItemFromS3({
	objectKey,
	bucketName,
}: {
	objectKey: string;
	bucketName: string;
}): Promise<OperationResult<{ body: string; lastModified?: Date }>> {
	return fileService
		.getFromS3({
			bucketName,
			key: objectKey,
		})
		.then((resp) => {
			if (resp.status === 'success') {
				return {
					status: 'success' as const,
					body: resp.body,
					lastModified: resp.lastModified,
				};
			}
			throw new Error(resp.reason);
		})
		.catch((error) => {
			return {
				status: 'failure' as const,
				reason: `Error getting object from S3 (key: ${objectKey}): ${getErrorMessage(error)}`,
			};
		});
}
