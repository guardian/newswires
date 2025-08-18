import { DATABASE_TABLE_NAME } from "../shared/constants";
import { initialiseDbConnection } from "../shared/rds";
// Set your region (replace with actual value or import from config)





const run = async () => {
    const { sql, closeDbConnection } = await initialiseDbConnection(true);
    try {
        console.log("Retrieving classifications from the database...");
        const result = await sql`
            SELECT * FROM ${sql(DATABASE_TABLE_NAME)} limit 100;
        `;
        console.log(`Retrieved ${result.length} records from the database.`);
        console.log('Classifications:');
    } catch (error) {
        console.error('Error retrieving classifications:', error);
    } finally {
        await closeDbConnection();
    }
};

run()