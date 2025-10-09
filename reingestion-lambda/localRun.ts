import { main } from "./src/handler";
async function run() {
    main({
        limit: 500,
        batchSize: 10,
        timeDelay: 1000,
        lastUpdatedSince: '2025-10-09T16:05:16.000Z',
        lastUpdatedUntil: '2025-10-09T16:05:17.000Z',
        lastUpdatedAtIsEmpty: undefined
    })
}
run()