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
	dedupeStrings,
	inferGBCategoryFromText,
	inferGeographicalCategoriesFromText,
	processFingerpostAAPCategoryCodes,
	processFingerpostAFPCategoryCodes,
	processFingerpostAPCategoryCodes,
	processFingerpostPACategoryCodes,
	processReutersDestinationCodes,
	processReutersTopicCodes,
	processUnknownFingerpostCategoryCodes,
	remapReutersCountryCodes,
} from './categoryCodes';
import { cleanBodyTextMarkup } from './cleanMarkup';
import { tableName } from './database';
import { BUCKET_NAME, s3Client } from './s3';
import { lookupSupplier } from './suppliers';

interface OperationFailure {
	sqsMessageId: string;
	status: 'failure';
	storyIdentifier?: string;
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

const isBadControlChar = (e: SyntaxError): boolean => {
	return !!e.message.match(/Bad control character in string literal in JSON/);
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

// Retrieve a value from a JSON-like string regardless of its validity.
export const extractFieldFromString = (
	input: string,
	targetField: string,
): string | undefined => {
	const regex = new RegExp(`"${targetField}"\\s*:\\s*"([^"]*)"`); // Capture a value from a "key": "value" pattern.
	const match = input.match(regex);
	return match ? match[1] : undefined;
};

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

export const processCategoryCodes = (
	supplier: string,
	subjectCodes: string[],
	destinationCodes: string[],
	bodyText?: string,
	priority?: string,
) => {
	const catCodes: string[] = priority === '1' ? ['HIGH_PRIORITY'] : [];
	const regionCodes = inferGeographicalCategoriesFromText(bodyText);

	switch (supplier) {
		case 'REUTERS': {
			const extractedDestinationCodes =
				processReutersDestinationCodes(destinationCodes);
			return [
				...catCodes,
				...subjectCodes,
				...extractedDestinationCodes,
				...processReutersTopicCodes(subjectCodes, extractedDestinationCodes),
				...regionCodes,
				...remapReutersCountryCodes(subjectCodes),
			];
		}
		case 'AP':
			return [
				...catCodes,
				...processFingerpostAPCategoryCodes(subjectCodes),
				...regionCodes,
			];
		case 'AAP':
			return [
				...catCodes,
				...processFingerpostAAPCategoryCodes(subjectCodes),
				...regionCodes,
			];
		case 'AFP':
			return [
				...catCodes,
				...processFingerpostAFPCategoryCodes(subjectCodes),
				...regionCodes,
			];
		case 'PA':
			return [...catCodes, ...processFingerpostPACategoryCodes(subjectCodes)];
		case 'MINOR_AGENCIES': {
			const updatedSubjectCodes = [
				...subjectCodes,
				...catCodes,
				...regionCodes,
				...inferGBCategoryFromText(bodyText),
			];
			return updatedSubjectCodes.filter((_) => _.length > 0);
		}
		default:
			return [
				...catCodes,
				...processUnknownFingerpostCategoryCodes(subjectCodes, supplier),
				...regionCodes,
			];
	}
};

export const decodeBodyTextContent = (
	text: string | undefined,
): string | undefined =>
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
		.replace(/(?:\n\s*)+/g, '<br />'); // Replaces consecutive newlines (and spaces) with one <br />.

export const safeJsonParse = (body: string): Record<string, unknown> => {
	try {
		return JSON.parse(body) as Record<string, unknown>;
	} catch (e) {
		if (e instanceof SyntaxError && isCurlyQuoteFailure(e)) {
			console.warn('Stripping badly escaped curly quote');
			// naïve regex to delete a backslash before a curly quote - isn't a fully correct solution.
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
			return JSON.parse(body.replaceAll(/\\([“‘”’])/g, '$1')) as Record<
				string,
				unknown
			>;
		}
		if (e instanceof SyntaxError && isBadControlChar(e)) {
			console.warn('Attempting to strip unescaped tab chars');
			// technically, the bad control char warning could appear for any control char that remains unescaped
			// inside a JSON string; but in practice we've only seen this for tab and newline characters so far. If
			// other control chars start appearing, this will start firing again, but we'll have to think carefully
			// about how we strip since this replace will affect all locations in the JSON document, not just inside
			// string literals.
			return JSON.parse(body.replaceAll(/[\t\r\n]/g, ' ')) as Record<
				string,
				unknown
			>;
		}
		throw e;
	}
};

export const safeBodyParse = (body: string): IngestorInputBody => {
	const json = safeJsonParse(body);

	const preprocessedKeywords = processKeywords(
		json.keywords as string | string[] | undefined,
	); // if it's not one of these, we probably want to throw an error

	const preprocessedBodyTextContent = decodeBodyTextContent(
		json.body_text as string | undefined,
	);

	return IngestorInputBodySchema.parse({
		...json,
		body_text: preprocessedBodyTextContent,
		keywords: preprocessedKeywords,
	});
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

						const content = {
							...snsMessageContent,
							body_text: cleanBodyTextMarkup(
								snsMessageContent.body_text ?? '',
								logger,
							),
						};

						const supplier =
							lookupSupplier(content['source-feed']) ?? 'Unknown';

						const categoryCodes = dedupeStrings(
							processCategoryCodes(
								supplier,
								content.subjects?.code ?? [],
								content.destinations?.code ?? [],
								`${content.headline ?? ''} ${content.abstract ?? ''} ${content.body_text}`,
								content.priority,
							),
						);

						const result = await sql`
                            INSERT INTO ${sql(tableName)}
                                (external_id, supplier, content, category_codes)
                            VALUES (${externalId}, ${supplier}, ${content as never}, ${categoryCodes}) ON CONFLICT (external_id) DO NOTHING
							RETURNING id`;

						if (result.length === 0) {
							logger.warn({
								message: `A record with the provided external_id (messageId: ${externalId}) already exists. No new data was inserted to prevent duplication.`,
								eventType: 'INGESTION_DUPLICATE_STORY',
								externalId,
								sqsMessageId,
							});
						} else {
							logger.log({
								message: `Successfully processed message for ${sqsMessageId} (${content.slug})`,
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
							storyIdentifier: extractFieldFromString(body, 'slug'),
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
			.map(({ sqsMessageId, storyIdentifier, reason }) => {
				console.error(
					`Failed to process message for ${sqsMessageId}${storyIdentifier ? ` (${storyIdentifier})` : ''}: ${reason}`,
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
