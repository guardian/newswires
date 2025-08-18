import { DATABASE_TABLE_NAME } from "../shared/constants";
import { initialiseDbConnection } from "../shared/rds";
import { classification } from "./src/classification";
// Set your region (replace with actual value or import from config)



// content: IngestorInputBody;
// supplier: Supplier;
// categoryCodes: string[];

const run = async () => {
    const { sql, closeDbConnection } = await initialiseDbConnection(true);
    try {
        console.log("Retrieving classifications from the database...");
        const result = await sql`
            SELECT * FROM ${sql(DATABASE_TABLE_NAME)} limit 5;
        `;
        console.log(`Retrieved ${result.length} records from the database.`);
        result.forEach(record => {
            console.log(`Processing record with ID: ${record.id}`);
            const classificationResult = classification({ content: record.content, supplier: record.supplier, categoryCodes: record.category_codes });
            console.log(`Classification result for record ID ${record.id}: ${JSON.stringify(classificationResult)}`);
        });
    } catch (error) {
        console.error('Error retrieving classifications:', error);
    } finally {
        await closeDbConnection();
    }
};

run()