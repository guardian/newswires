import type postgres from 'postgres';
import {
	DATABASE_TABLE_NAME,
	SUCCESSFUL_INGESTION_EVENT_TYPE,
} from '../../shared/constants';
import { getErrorMessage } from '../../shared/getErrorMessage';
import type { Logger } from '../../shared/lambda-logging';
import type { OperationResult, ProcessedObject } from '../../shared/types';

export async function putItemToDb({
	processedObject,
	externalId,
	s3Key,
	classifications,
	sql,
	logger,
}: {
	processedObject: ProcessedObject;
	externalId: string;
	s3Key: string;
	classifications: string[];
	sql: postgres.Sql;
	logger: Logger;
}): Promise<OperationResult<{ didCreateNewItem: boolean }>> {
	const { content, supplier, categoryCodes } = processedObject;
	try {
		// TODO, set up a test for this. 
		const result = await sql`
		INSERT INTO ${sql(DATABASE_TABLE_NAME)}
			(external_id, supplier, content, category_codes, s3_key, classifications)
		VALUES (${externalId}, ${supplier}, ${content as never}, ${categoryCodes}, ${s3Key}, ${classifications}) ON CONFLICT (external_id) DO UPDATE
		SET content = EXCLUDED.content,
			supplier = EXCLUDED.supplier,
			category_codes = EXCLUDED.category_codes,
			s3_key = EXCLUDED.s3_key,
			classifications = EXCLUDED.classifications,
			last_updated_at = ${Date.now()}
		RETURNING id`;
		// would this be a failure case now?
		if (result.length === 0) {
			logger.warn({
				message: `A record with the provided external_id (messageId: ${externalId}) already exists. No new data was inserted to prevent duplication.`,
				eventType: 'INGESTION_DUPLICATE_STORY',
				externalId,
			});
		} else {
			logger.log({
				message: `Successfully processed message for (external_id: ${externalId}, slug: ${content.slug})`,
				eventType: SUCCESSFUL_INGESTION_EVENT_TYPE,
				externalId,
				supplier,
			});
		}
		console.log(`Inserted item with externalId ${externalId} into the database.`);
		return {
			status: 'success',
			didCreateNewItem: result.length > 0,
		};
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return {
			status: 'failure',
			reason: `Failed to insert item with externalId ${externalId} into the database: ${errorMessage}`,
		};
	}
}
