import { initialiseDbConnection } from '../../shared/rds';
import { classification } from "../../shared/classification";
import { IngestorInputBody } from '../../shared/types';
import { batchedRecords } from '../../shared/util';


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

const getRecords: (n: number) => Promise<DBRecord[]> = async(n) => {
    const { sql, closeDbConnection} = await initialiseDbConnection();
    try {
        const results = await sql`SELECT external_id, content, supplier, category_codes FROM fingerpost_wire_entry limit ${n};`
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
    console.log(`Updating records ${records.length}`)
    const { sql, closeDbConnection} = await initialiseDbConnection();
  
    const sqlStatement = `UPDATE fingerpost_wire_entry AS fwe
                   SET classifications = data.classifications,
                       last_updated_at= TO_TIMESTAMP(${Date.now()})
                   FROM (VALUES ${values}) AS data (external_id, classifications)
                   WHERE fwe.external_id = data.external_id;`
    try {
        await sql.unsafe(sqlStatement)
    } catch (error) {
        console.error("Error updating records:", error);
        throw error;
    } finally {
        closeDbConnection();
    }
}



export const main = async (n: number): Promise<void> => {

	const records = (await getRecords(n)).map((record) => ({
        externalId: record.externalId,
        classifications: classification(record.processedObject)
    }))
    const batched = batchedRecords(records, 1000)
    console.log(`Updating ${records.length} records in ${batched.length} batches`)
    batched.map(async (batch, i) => {
        console.log(`Processing batch ${i + 1}/${batched.length}`);
        await updateRecords(batch)
    })
    
    console.log(`Finished updating ${records.length} records`);
};

