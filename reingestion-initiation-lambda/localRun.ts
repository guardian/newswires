import { main } from "./src/handler";
async function run() {
    main({ n: 1, batchSize: 1, timeDelay: 0 })
}
run()