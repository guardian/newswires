import { main } from "./src/handler";
async function run() {
    main({
        limit: 500,
        batchSize: 10,
        timeDelay: 1000,
        lastUpdatedSince: undefined,
        lastUpdatedUntil: undefined,
        lastUpdatedAtIsEmpty: false
    })
}
run()