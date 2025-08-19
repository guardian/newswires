import { SQSEvent, SQSRecord } from "aws-lambda";
import { main } from "./src/handler";
import { initialiseDbConnection } from "../shared/rds";

type Message = {
    externalId: string;
    objectKey: string;
}

const getMessages: () => Promise<Message[]> = async() => {
    const { sql, closeDbConnection} = await initialiseDbConnection();
    try {
        const results = await sql`SELECT external_id, s3_key FROM fingerpost_wire_entry`;
        return results.map(record => ({
            externalId: record.external_id as string,
            objectKey: record.s3_key as string
        } as Message));
    } catch (error) {
        console.error("Error getting messages:", error);
        throw error;
    } finally{
        closeDbConnection();
    }
}
async function run() {

    const Records = (await getMessages()).map((message) => {
        return createSQSRecord(message.externalId, message.objectKey)
    })
    const event: SQSEvent = { Records };
    main(event).then(console.log).catch(console.error);

}


function createSQSRecord(externalId: string, objectKey: string) : SQSRecord {
    const randomSqsMessageId = Math.random().toString(36).substring(7);

    const recordThatShouldSucceed: SQSRecord = {
        messageId: randomSqsMessageId,
        body: JSON.stringify({
            externalId,
            objectKey
        }),
    } as unknown as SQSRecord;
    return recordThatShouldSucceed;
}

run()