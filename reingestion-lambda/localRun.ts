import { main } from "./src/handler";
async function run() {
    main({
        limit: 25,
        batchSize: 10,
        timeDelay: 1000
    })
}
run()