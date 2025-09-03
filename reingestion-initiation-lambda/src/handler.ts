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
    processedObject: ProcessedObject;
    s3key: string;
}

type UpdateRecord = {
    externalId: string;
    classifications: string[];
    processedObject: ProcessedObject;
    s3key?: string;
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
            },
            s3key: record.s3_key,
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
const createTempTable = async (sql: Sql) => {
    await sql`CREATE TEMP TABLE temp_classifications (
        external_id TEXT PRIMARY KEY,
        classifications TEXT[]
    );`
}

const insertRecords = async (sql: Sql, records: UpdateRecord[]) => {
    const values = records.map(record => `('${record.externalId}', ${toPostgressArray(record.classifications)})`)
    try {
        await sql`Truncate temp_classifications`;
        await sql.unsafe(`INSERT INTO temp_classifications (external_id, classifications) VALUES ${values}`);
        await sql`ANALYZE temp_classifications;`
    } catch (error) {
        console.error("Error inserting records:", error);
    }
}

const updateRecords: (sql: Sql, records: UpdateRecord[]) => Promise<void> = async (sql, records) => {
    const sqlStatement = `
                UPDATE fingerpost_wire_entry fwe
                SET classifications = tu.classifications,
                    last_updated_at = now()
                FROM temp_classifications tu
                WHERE fwe.external_id = tu.external_id;`
    try {
        await sql.unsafe(sqlStatement)
    } catch (error) {
        console.error("Error updating records:", sqlStatement);
        // throw error;
    }
}


const insertOnConflict: (sql: Sql, records: UpdateRecord[]) => Promise<void> = async (sql, records) => {  
    try {
        sql(`INSERT INTO fingerpost_wire_entry
            (external_id)
            VALUES ${sql(records) }
            ON CONFLICT (external_id) DO UPDATE
            SET
            content = EXCLUDED.content,
            supplier = EXCLUDED.supplier,
            category_codes = EXCLUDED.category_codes,
            s3_key = EXCLUDED.s3_key,
            classifications = EXCLUDED.classifications,
            last_updated_at = now()`
    )
    } catch (error) {
        console.error("Error updating records:", error);
        // throw error;
    }                        
}


export const main = async ({ n, batchSize, timeDelay }: { n: number; batchSize: number; timeDelay: number }): Promise<void> => {
    // const count = await getRecordsCount();
    const count = n;
    console.info(`Reclassifying ${count} from database `);

    const BATCH_SIZE  = batchSize;
    console.info(`Running for batch sizes ${batchSize}`)
    const offsets  = computeOffsets(count, BATCH_SIZE);
    const { sql, closeDbConnection} = await initialiseDbConnection();
    for(const [index, offset] of offsets.entries()) {
        console.info(`Processing batch ${index + 1} of ${offsets.length}`, new Date().toISOString());
        const records = (await getRecords(sql, BATCH_SIZE, offset)).map((record) => ({
            externalId: record.externalId,
            classifications: classification(record.processedObject),
            s3key: record.s3key,
            processedObject: record.processedObject
        }))
        console.info(`Finished mapping batch ${index + 1} of ${offsets.length}`, new Date().toISOString());
        await insertOnConflict(sql, records)
        console.info(`Finished inserting batch ${index + 1} of ${offsets.length}`, new Date().toISOString());
        await new Promise((res) => setTimeout(res, timeDelay));
    }
    closeDbConnection();
    console.info(`Finished updating ${count} records`);
};

