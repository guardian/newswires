import { DATABASE_TABLE_NAME } from "../shared/constants";
import { createLogger } from "../shared/lambda-logging";
import { initialiseDbConnection } from "../shared/rds";
import { putItemToDb } from "./src/db";
import * as fs from 'fs';
import * as path from 'path';


const writeToFile = async (limit: number = 100) => {
    const code = await initialiseDbConnection(true);
    try {
        console.log("Retrieving classifications from the database...");
        const result = await code.sql`SELECT * FROM ${code.sql(DATABASE_TABLE_NAME)} where s3_key is not null limit ${limit}`;
        console.log(`Retrieved ${result.length} records from the database.`);
        const data = result.map(record => ({
            processedObject: {
                content: record.content,
                supplier: record.supplier,
                categoryCodes: record.category_codes
            },
            externalId: record.external_id,
            s3Key: record.s3_key
        }));
        const filePath = path.join(__dirname, 'output.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log('JSON file written to:', filePath); 
    } catch (error) {
        console.error('Error retrieving classifications:', error);
    } finally {
        await code.closeDbConnection();
    }
};

const run = async () => {
    const { sql, closeDbConnection } = await initialiseDbConnection();
    const logger = createLogger({});
    
    const filePath = path.join(__dirname, 'output.json')
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const result = JSON.parse(rawData);
    
    Promise.all(result.map(async (record: any) => {    
        return putItemToDb({
            processedObject: {
                content: record.processedObject.content,
                supplier: record.processedObject.supplier,
                categoryCodes: record.processedObject.categoryCodes
            },
            externalId: record.externalId,
            s3Key: record.s3Key,
            sql: sql,
            logger: logger,
        }).then((result) => {   
        console.log("RESULT", result);
    })}))
    .then(_ => closeDbConnection());

}
run()
// writeToFile(5000)
