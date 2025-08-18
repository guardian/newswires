import { DATABASE_TABLE_NAME } from "../shared/constants";
import { initialiseDbConnection } from "../shared/rds";
import { fromIni } from "@aws-sdk/credential-providers";
import { SSMClient } from "@aws-sdk/client-ssm";
// Set your region (replace with actual value or import from config)
const v2Region: string = "us-west-2"; // Example region

// Load credentials from a specific profile
const awsV2Credentials = fromIni({ profile: "profile" });

// Create SSM client
const ssmClient = new SSMClient({
  region: v2Region,
  credentials: awsV2Credentials,
});


const run = async () => {
    const { sql, closeDbConnection } = await initialiseDbConnection();
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

run();

