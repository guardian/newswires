import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import type { SQSRecord } from 'aws-lambda';
import { getFromEnv } from '../../shared/config';
import { initialiseDbConnection } from '../../shared/rds';
import { sqs } from '../../shared/sqs';
import { batchedRecords } from '../../shared/util';

type DBRecord = {
	externalId: string;
	objectKey: string;
};

const getDBRecords: (n: number) => Promise<DBRecord[]> = async (n) => {
	const { sql, closeDbConnection } = await initialiseDbConnection();
	try {
		const results =
			await sql`SELECT external_id, s3_key FROM fingerpost_wire_entry where s3_key is not null limit ${n};`;
		return results.map(
			(record) =>
				({
					externalId: record.external_id as string,
					objectKey: record.s3_key as string,
				}) as DBRecord,
		);
	} catch (error) {
		console.error('Error getting messages:', error);
		throw error;
	} finally {
		await closeDbConnection();
	}
};

function createSQSRecord(externalId: string, objectKey: string): SQSRecord {
	const randomSqsMessageId = Math.random().toString(36).substring(7);

	const recordThatShouldSucceed: SQSRecord = {
		messageId: randomSqsMessageId,
		body: JSON.stringify({
			externalId,
			objectKey,
		}),
	} as unknown as SQSRecord;
	return recordThatShouldSucceed;
}

export const main = async (n: number): Promise<void> => {
	const messages = await getDBRecords(n);
	console.log('Retrieved messages:', messages);

	const records = (await getDBRecords(5)).map((message) => {
		return createSQSRecord(message.externalId, message.objectKey);
	});

	const sendCommands = batchedRecords(records, 10).map((batch) => {
		return new SendMessageBatchCommand({
			QueueUrl: getFromEnv('REINGESTION_QUEUE_URL'),
			Entries: batch.map((record) => ({
				Id: record.messageId,
				MessageBody: record.body,
			})),
		});
	});
	console.log(`Writing ${sendCommands.length} messages to SQS`);

	await Promise.all(
		sendCommands.map((command) => {
			return sqs.send(command);
		}),
	).then((_) => {
		console.log('All messages sent successfully');
	});
};
