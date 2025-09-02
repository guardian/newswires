import { main } from "./src/handler";
async function run() {
    main({ n: 10000, batchSize: 10000, timeDelay: 0 })
}
run()