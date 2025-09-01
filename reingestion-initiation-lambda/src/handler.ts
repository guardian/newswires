import { initialiseDbConnection } from '../../shared/rds';
import { classification } from "../../shared/classification";
import { IngestorInputBody } from '../../shared/types';
import { batchedRecords, computeOffsets } from '../../shared/util';
import { off } from 'process';
import { Sql } from 'postgres';


type ProcessedObject = {
    content: unknown;
    supplier: string;
    categoryCodes: string[];
};

type DBRecord = {
    externalId: string;
    processedObject: ProcessedObject
}

type UpdateRecord = {
    externalId: string;
    classifications: string[];
}

const getRecordsCount: () => Promise<number> = async () => {
    const { sql, closeDbConnection} = await initialiseDbConnection();
    try {
        const result = await sql`SELECT COUNT(*) FROM fingerpost_wire_entry;`
        return Number(result[0].count);
    } catch (error) {
        console.error("Error getting records count:", error);
        throw error;
    } finally {
        closeDbConnection();
    }
}

const getRecords: (sql: Sql, n: number, offset: number) => Promise<DBRecord[]> = async(sql, n, offset) => {
    try {
        const results = await sql`SELECT external_id, content, supplier, category_codes FROM fingerpost_wire_entry limit ${n} offset ${offset};`
        return results.map(record => ({
            externalId: record.external_id as string,
            processedObject: {
                content: record.content as IngestorInputBody,
                supplier: record.supplier as string,
                categoryCodes: record.category_codes as string[],
            }
        } as DBRecord));
    } catch (error) {
        console.error("Error getting messages:", error);
        throw error;
    } 
}
const toPostgressArray = (classifications: string[]) => {
    if(classifications.length === 0) return 'ARRAY[]::text[]'
    return `ARRAY[${classifications.map(c => `'${c}'`).join(',')}]`
}

const updateRecords: (sql: Sql, records: UpdateRecord[]) => Promise<void> = async (sql, records) => {
    const values = records.map(record => `('${record.externalId}', ${toPostgressArray(record.classifications)})`)
    console.info(`Updating records ${records.length}`)
    const sqlStatement = `UPDATE fingerpost_wire_entry AS fwe
                   SET classifications = data.classifications,
                       last_updated_at= TO_TIMESTAMP(${Date.now()} / 1000.0)
                   FROM (VALUES ${values}) AS data (external_id, classifications)
                   WHERE fwe.external_id = data.external_id;`
    try {
        await sql.unsafe(sqlStatement)
    } catch (error) {
        console.error("Error updating records:", sqlStatement);
        // throw error;
    }
}



export const main = async ({ n, batchSize }: { n: number; batchSize: number }): Promise<void> => {
    // const count = await getRecordsCount();
    const count = n;
    console.info(`Reclassifying ${count} from database `);

    const BATCH_SIZE  = batchSize;
    console.info(`Running for batch sizes ${batchSize}`)
    const offsets  = computeOffsets(count, BATCH_SIZE);
    const { sql, closeDbConnection} = await initialiseDbConnection();
    for(const [index, offset] of offsets.entries()) {
        console.info(`Processing batch ${index + 1} of ${offsets.length}`);
        const records = (await getRecords(sql, BATCH_SIZE, offset)).map((record) => ({
            externalId: record.externalId,
            classifications: classification(record.processedObject)
        }))
        await updateRecords(sql, records)
        await new Promise((res) => setTimeout(res, 10000));
    }
    closeDbConnection();
    console.info(`Finished updating ${count} records`);
};

