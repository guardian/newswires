import { getErrorMessage } from '@guardian/libs';
import type postgres from 'postgres';
import {
	DATABASE_TABLE_NAME,
	SUCCESSFUL_INGESTION_EVENT_TYPE,
} from '../../shared/constants';
import type { Logger } from '../../shared/lambda-logging';
import { computePresetCategories } from '../../shared/precomputeCategories';
import type { OperationResult, ProcessedObject } from '../../shared/types';

export async function putItemToDb({
	processedObject,
	externalId,
	s3Key,
	lastModified,
	sql,
	logger,
}: {
	processedObject: ProcessedObject;
	externalId: string;
	s3Key: string;
	lastModified?: Date;
	sql: postgres.Sql;
	logger: Logger;
}): Promise<OperationResult<{ didCreateNewItem: boolean }>> {
	const { content, supplier, categoryCodes } = processedObject;
	const computedCategories = computePresetCategories(categoryCodes);
	const ingestedAt = (lastModified ?? new Date()).toISOString();
	try {
		const result = await sql`
		INSERT INTO ${sql(DATABASE_TABLE_NAME)}
			(external_id, supplier, content, category_codes, s3_key, ingested_at, precomputed_categories, last_updated_at)
		VALUES (${externalId}, ${supplier}, ${content as never}, ${categoryCodes}, ${s3Key}, ${ingestedAt}, ${computedCategories}, now()) ON CONFLICT (external_id) DO NOTHING
		RETURNING id`;

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
