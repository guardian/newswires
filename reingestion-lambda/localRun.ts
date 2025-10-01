import { main } from "./src/handler";
async function run() {
    main({
        limit: 4,
        batchSize: 1,
        timeDelay: 1000,
        lastUpdatedSince: '2025-10-01T15:26:35Z',
        lastUpdatedUntil: '2025-10-01T15:34:35Z'
    })
}
run()