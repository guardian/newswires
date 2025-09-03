import { main } from "./src/handler";
async function run() {
    main({ n: 10, batchSize: 2, timeDelay: 0 })
}
run()