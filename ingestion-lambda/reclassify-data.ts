import { SQSEvent, SQSRecord } from "aws-lambda";
import { main } from "../reingestion-initiation-lambda/src/handler";
import { initialiseDbConnection } from "../shared/rds";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { getFromEnv } from "../shared/config";
import { sqs } from "../shared/sqs";
import { batchedRecords } from "../shared/util";
import { ProcessedObject } from "../shared/types";
import { classification } from "../shared/classification";


type DBRecord = {
    externalId: string;
    processedObject: ProcessedObject
}

type UpdateRecord = {
    externalId: string;
    classifications: string[];
}
const getRecords: (n: number) => Promise<DBRecord[]> = async(n) => {
    const { sql, closeDbConnection} = await initialiseDbConnection();
    try {
        const results = await sql`SELECT external_id, content, supplier, category_codes FROM fingerpost_wire_entry limit ${n};`
        return results.map(record => ({
            externalId: record.external_id as string,
            processedObject: {
                content: record.content as never,
                supplier: record.supplier as string,
                categoryCodes: record.category_codes as string[],
            }
        } as DBRecord));
    } catch (error) {
        console.error("Error getting messages:", error);
        throw error;
    } finally{
        closeDbConnection();
    }
}

const updateRecords: (records: UpdateRecord[]) => Promise<void> = async (records) => {
    console.log(`Updating records with ids: ${records.map(record => record.externalId).join(", ")}`)
    const { sql, closeDbConnection} = await initialiseDbConnection();
    try {
        await sql`INSERT INTO fingerpost_wire_entry (external_id, classifications)
                   VALUES ${records.map(record => [record.externalId, record.classifications])}
                   ON CONFLICT (external_id) DO UPDATE SET
                   classifications = excluded.classifications`;
    } catch (error) {
        console.error("Error updating records:", error);
        throw error;
    } finally {
        closeDbConnection();
    }
}

async function run() {

    const records = (await getRecords(5)).map((record) => ({
        externalId: record.externalId,
        classifications: classification(record.processedObject)
    }));

    await updateRecords(records)
   
    console.log("All records updated");
    

}


run()