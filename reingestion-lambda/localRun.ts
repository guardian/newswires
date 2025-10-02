import { main } from "./src/handler";
async function run() {
    main({
        limit: 4,
        batchSize: 1,
        timeDelay: 1000,
        lastUpdatedSince: undefined,
        lastUpdatedUntil: undefined
    })
}
run()