import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import {
	INGESTION_PROCESSING_SQS_MESSAGE_EVENT_TYPE,
	SUCCESSFUL_INGESTION_EVENT_TYPE,
} from '../../shared/constants';
import { createLogger } from '../../shared/lambda-logging';
import { createDbConnection } from '../../shared/rds';
import type { IngestorInputBody } from '../../shared/types';
import { IngestorInputBodySchema } from '../../shared/types';
import {
	processFingerpostAAPCategoryCodes,
	processFingerpostAFPCategoryCodes,
	processFingerpostAPCategoryCodes,
} from './categoryCodes';
import { tableName } from './database';
import { BUCKET_NAME, s3Client } from './s3';
import { lookupSupplier } from './suppliers';

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

function cleanAndDedupeKeywords(keywords: string[]): string[] {
	return [
		...new Set(
			keywords
				.map((keyword) => keyword.trim())
				.filter((keyword) => keyword.length > 0),
		),
	];
}

export const processKeywords = (
	keywords: string | string[] | undefined,
): string[] => {
	if (keywords === undefined) {
		return [];
	}
	if (Array.isArray(keywords)) {
		return cleanAndDedupeKeywords(keywords);
	}
	return cleanAndDedupeKeywords(keywords.split('+'));
};

const processCategoryCodes = (
	supplier: string | undefined,
	subjectCodes: string[],
) => {
	switch (supplier) {
		case 'AP':
			return processFingerpostAPCategoryCodes(subjectCodes);
		case 'AAP':
			return processFingerpostAAPCategoryCodes(subjectCodes);
		case 'AFP':
			return processFingerpostAFPCategoryCodes(subjectCodes);
		default:
			return [];
	}
};

export const decodeBodyTextContent = (text: string | undefined): string | undefined =>
	text
		?.replace(
			/\\u([0-9a-fA-F]{4})/g,
			(_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)), // Replace Unicode escape sequences, e.g. \u00a0 → non-breaking space.
		)
		.replace(/\\([\\nrt"'])/g, (_: string, group1: string) => {
			switch (group1) {
				case 'n':
					return '\n';
				case 'r':
					return '\r';
				case 't':
					return '\t';
				default:
					return group1;
			}
		})
		.replace(/\n/g, '<br />');

const safeBodyParse = (body: string): IngestorInputBody => {
	try {
		const json = JSON.parse(body) as Record<string, unknown>;

		const preprocessedKeywords = processKeywords(
			json.keywords as string | string[] | undefined,
		); // if it's not one of these, we probably want to throw an error

		const preprocessedBodyTextContent = decodeBodyTextContent(
			json.body_Text as string | undefined,
		);

		return IngestorInputBodySchema.parse({
			...json,
			body_text: preprocessedBodyTextContent,
			keywords: preprocessedKeywords,
		});
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

export const main = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const records = event.Records;

	const sql = await createDbConnection();

	const logger = createLogger({});

	try {
		console.log(`Processing ${records.length} messages`);

		const results = await Promise.all(
			records.map(
				async ({
						   messageId: sqsMessageId,
						   messageAttributes,
						   body,
					   }): Promise<OperationResult> => {
					logger.log({
						message: `Processing message for ${sqsMessageId}`,
						eventType: INGESTION_PROCESSING_SQS_MESSAGE_EVENT_TYPE,
						sqsMessageId,
					});
					try {
						const externalId = messageAttributes['Message-Id']?.stringValue;

						if (!externalId) {
							await s3Client.send(
								new PutObjectCommand({
									Bucket: BUCKET_NAME,
									Key: `GuMissingExternalId/${sqsMessageId}.json`,
									Body: JSON.stringify({
										externalId,
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
								Key: `${externalId}.json`,
								Body: body,
							}),
						);

						const snsMessageContent = safeBodyParse(body);

						const supplier = lookupSupplier(snsMessageContent['source-feed']);

						const categoryCodes = processCategoryCodes(
							supplier,
							snsMessageContent.subjects?.code ?? [],
						);

						const result = await sql`
							INSERT INTO ${sql(tableName)}
								(external_id, supplier, content, category_codes)
							VALUES (${externalId}, ${supplier ?? 'Unknown'}, ${snsMessageContent as never}, ${categoryCodes}) ON CONFLICT (external_id) DO NOTHING
						RETURNING id`;

						if (result.length === 0) {
							logger.warn({
								message: `A record with the provided external_id (messageId: ${externalId}) already exists. No new data was inserted to prevent duplication.`,
								eventType: 'INGESTION_DUPLICATE_STORY',
								externalId,
								sqsMessageId,
							});
						} else {
							// this logging format is for the Cloudwatch Metric Filter
							console.log({
								externalId,
								supplier,
								sourceFeed: snsMessageContent['source-feed'],
								eventType: SUCCESSFUL_INGESTION_EVENT_TYPE,
							});
							// this logging format is for ELK
							logger.log({
								message: `Successfully processed message for ${sqsMessageId}`,
								eventType: SUCCESSFUL_INGESTION_EVENT_TYPE,
								sqsMessageId,
								externalId,
								supplier,
							});
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
