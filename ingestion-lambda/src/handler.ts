import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import type { IngestorInputBody } from '../../shared/types';
import { IngestorInputBodySchema } from '../../shared/types';
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

const isCurlyQuoteFailure = (e: SyntaxError): boolean => {
	return !!e.message.match(/Unexpected token '[“‘”’]'/);
};

const safeBodyParse = (body: string): IngestorInputBody => {
	try {
		return IngestorInputBodySchema.parse(JSON.parse(body));
	} catch (e) {
		if (e instanceof SyntaxError && isCurlyQuoteFailure(e)) {
			console.warn('Stripping badly escaped curly quote');
			// näive regex to delete a backslash before a curly quote - isn't a fully correct solution.
			// what if a string had 2 backslashes then a curly quote? that would be a correct string, that
			// we'd make incorrect by deleting the second backslash. We could fix that, but then what about
			// 3 backslashes then a curly quote? etc. infinitely
			// Generally it seems pretty unlikely that text would include literal backslashes before curly quotes,
			// if we start finding some then we should investigate improvements...
			//
			// I got to this monstrosity:
			//   .replaceAll(/(?<![^\\]\\(?:\\\\)*)\\(?!["\\/bfnrt]|u[0-9A-Fa-f]{4})/g, '')
			//
			// which looks like it should delete all illegal backslashes in a JSON string, but haven't rigorously tested it...
			return IngestorInputBodySchema.parse(
				JSON.parse(body.replaceAll(/\\([“‘”’])/g, '$1')),
			);
		}
		throw e;
	}
};

export const processKeywords = (keywords: string | undefined): string[] => {
	if (keywords === undefined) {
		return [];
	}
	const keywordsArray = keywords
		.split('+')
		.map((keyword) => keyword.trim())
		.filter((keyword) => keyword.length > 0);
	return [...new Set(keywordsArray)]; // remove duplicates
};

export const main = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const records = event.Records;

	const sql = await createDbConnection();

	try {
		console.log(`Processing ${records.length} messages`);

		const results = await Promise.all(
			records.map(
				async ({
					messageId: sqsMessageId,
					messageAttributes,
					body,
				}): Promise<OperationResult> => {
					try {
						const messageId = messageAttributes['Message-Id']?.stringValue;

						if (!messageId) {
							await s3Client.send(
								new PutObjectCommand({
									Bucket: BUCKET_NAME,
									Key: `GuMissingExternalId/${sqsMessageId}.json`,
									Body: JSON.stringify({
										messageId,
										messageAttributes,
										body,
									}),
								}),
							);
							throw new Error(
								`Message (sqsMessageId: ${sqsMessageId}) is missing fingerpost Message-Id attribute`,
							);
						}

						// todo -- consider storing s3 object version in db
						await s3Client.send(
							new PutObjectCommand({
								Bucket: BUCKET_NAME,
								Key: `${messageId}.json`,
								Body: body,
							}),
						);

						const snsMessageContent = safeBodyParse(body);

						const result = await sql`
                            INSERT INTO ${sql(tableName)}
                                (external_id, content)
                            VALUES (${messageId}, ${snsMessageContent as never}) ON CONFLICT (external_id) DO NOTHING
						RETURNING id`;

						if (result.length === 0) {
							console.warn(
								`A record with the provided external_id (messageId: ${messageId}) already exists. No new data was inserted to prevent duplication.`,
							);
						}
					} catch (e) {
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
