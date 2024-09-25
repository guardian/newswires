import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { BUCKET_NAME } from './config';
import { tableName } from './database';
import { createDbConnection } from './rds';
import { s3Client } from './s3';

interface OperationFailure {
	sqsMessageId: string;
	status: 'failure';
	reason?: string;
}

interface OperationSuccess {
	sqsMessageId: string;
	status: 'success';
}

type OperationResult = OperationFailure | OperationSuccess;

export const main = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const records = event.Records;

	const sql = await createDbConnection();

	try {
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
						const snsMessageContent: { keywords?: string } = JSON.parse(body);

						const finalContent =
							!snsMessageContent.keywords ||
							Array.isArray(snsMessageContent.keywords)
								? snsMessageContent
								: {
										...snsMessageContent,
										keywords: snsMessageContent.keywords.split('+'), // re-write the keywords field as an array
									};

						await sql`
						INSERT INTO ${sql(tableName)}
							(external_id, content)
						VALUES
							(${fingerpostMessageId ?? null}, ${finalContent as never})
						RETURNING id`.then((res) => {
							if (res.length === 0) {
								throw new Error('Failed to insert record into DB');
							}
						});
					} catch (e) {
						console.log(e);
						console.log('^');
						const reason = e instanceof Error ? e.message : 'Unknown error';
						return {
							status: 'failure',
							reason,
							sqsMessageId,
						};
					}

					return { sqsMessageId, status: 'success' };
				},
			),
		);
		const batchItemFailures = results
			.filter(
				(result): result is OperationFailure => result.status === 'failure',
			)
			.map(({ sqsMessageId, reason }) => {
				console.error(
					`Failed to process message for ${sqsMessageId}: ${reason}`,
				);
				return { itemIdentifier: sqsMessageId };
			});
		console.log(
			`Processed ${records.length} messages with ${batchItemFailures.length} failures`,
		);

		return { batchItemFailures };
	} finally {
		await sql.end();
	}
};
