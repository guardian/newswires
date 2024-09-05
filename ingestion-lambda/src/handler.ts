import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { BUCKET_NAME } from './config';
import { tableName } from './database';
import { createDbConnection } from './rds';
import { s3Client } from './s3';

type OperationOutcome = 'success' | 'failure';

interface OperationResult {
	sqsMessageId: string;
	status: OperationOutcome;
}

export const main = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const records = event.Records;

	const sql = await createDbConnection();

	console.log(`Processing ${records.length} messages`);

	const results = await Promise.all(
		records.map(
			async ({
				messageId,
				messageAttributes,
				body,
			}): Promise<OperationResult> => {
				const sqsMessageId = messageId;

				try {
					const fingerpostMessageId =
						messageAttributes['Message-Id']?.stringValue;

					if (!fingerpostMessageId) {
						console.warn(
							`Message ${sqsMessageId} is missing Message-Id attribute`,
						);
					}

					// todo -- consider storing s3 object version in db
					await s3Client.send(
						new PutObjectCommand({
							Bucket: BUCKET_NAME,
							Key: `${fingerpostMessageId}.json`,
							Body: body,
						}),
					);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- seems like postgres.js requires this format? https://github.com/porsager/postgres/issues/587#issuecomment-1563262612
					const snsMessageContent = JSON.parse(body);
					await sql`
						INSERT INTO ${sql(tableName)}
							(external_id, content)
						VALUES
							(${fingerpostMessageId ?? null}, ${snsMessageContent})
						RETURNING id`.then((res) => {
						if (res.length === 0) {
							return 'failure';
						}
						return 'success';
					});
				} catch {
					return Promise.resolve({
						status: 'failure',
						sqsMessageId,
					});
				}

				return { sqsMessageId, status: 'success' };
			},
		),
	);

	await sql.end();

	const batchItemFailures = results
		.filter(({ status }) => status === 'failure')
		.map(({ sqsMessageId }) => ({ itemIdentifier: sqsMessageId }));

	console.log(
		`Processed ${records.length} messages with ${batchItemFailures.length} failures`,
	);

	return { batchItemFailures };
};
