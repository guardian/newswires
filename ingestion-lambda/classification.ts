import { record } from "zod";
import { DATABASE_TABLE_NAME } from "../shared/constants";
import { createLogger } from "../shared/lambda-logging";
import { initialiseDbConnection } from "../shared/rds";
import { ProcessedObject } from "../shared/types";
import { classification } from "./src/classification";
import { putItemToDb } from "./src/db";
import * as fs from 'fs';
import * as path from 'path';
// Set your region (replace with actual value or import from config)



// content: IngestorInputBody;
// supplier: Supplier;
// categoryCodes: string[];


const writeToFile = async (limit: number = 100) => {
    const code = await initialiseDbConnection(true);
    try {
        console.log("Retrieving classifications from the database...");
        const result = await code.sql`SELECT * FROM ${code.sql(DATABASE_TABLE_NAME)} limit ${limit}`;
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
    // const code = await initialiseDbConnection(true);
    const { sql, closeDbConnection } = await initialiseDbConnection();
    const logger = createLogger({});
    try {
        const filePath = path.join(__dirname, 'output.json')
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const result = JSON.parse(rawData);

        result.forEach(record => {
            // const classificationResult = classification({ content: record.content, supplier: record.supplier, categoryCodes: record.category_codes });
            putItemToDb({
                processedObject: {
                    content: record.processedObject.content,
                    supplier: record.processedObject.supplier,
                    categoryCodes: record.processedObject.categoryCodes
                },
                externalId: record.externalId,
                s3Key: 'key',
                sql: sql,
                logger: logger,
            });
        });
    } catch (error) {
        console.error('Error retrieving classifications:', error);
    } finally {
        await closeDbConnection();
    }
};
run()