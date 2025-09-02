import { main } from "./src/handler";
async function run() {
    main({ n: 1000, batchSize: 1000, timeDelay: 0 })
}
run()