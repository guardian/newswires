import { initialiseDbConnection } from '../../shared/rds';
import { classification } from "../../shared/classification";
import { IngestorInputBody } from '../../shared/types';
import { batchedRecords, computeOffsets } from '../../shared/util';
import { off } from 'process';


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

const getRecords: (n: number, offset: number) => Promise<DBRecord[]> = async(n, offset) => {
    const { sql, closeDbConnection} = await initialiseDbConnection();
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
    } finally{
        closeDbConnection();
    }
}
const toPostgressArray = (classifications: string[]) => {
    if(classifications.length === 0) return 'ARRAY[]::text[]'
    return `ARRAY[${classifications.map(c => `'${c}'`).join(',')}]`
}

const updateRecords: (records: UpdateRecord[]) => Promise<void> = async (records) => {
    const values = records.map(record => `('${record.externalId}', ${toPostgressArray(record.classifications)})`)
    console.info(`Updating records ${records.length}`)
    const { sql, closeDbConnection} = await initialiseDbConnection();
  
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
    } finally {
        closeDbConnection();
    }
}



export const main = async (n: number, batchSize: number): Promise<void> => {
    // const count = await getRecordsCount();
    const count = n;
    console.info(`Reclassifying ${count} from database `);

    const BATCH_SIZE  = batchSize;
    console.info(`Running for batch sizes ${batchSize}`)
    const offsets  = computeOffsets(count, BATCH_SIZE);
    for(const [index, offset] of offsets.entries()) {
        console.info(`Processing batch ${index + 1} of ${offsets.length}`);
        const records = (await getRecords(BATCH_SIZE, offset)).map((record) => ({
            externalId: record.externalId,
            classifications: classification(record.processedObject)
        }))
        await updateRecords(records)
    }
    console.info(`Finished updating ${count} records`);
};

