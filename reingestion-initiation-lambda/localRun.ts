import { main } from "./src/handler";
async function run() {
    main({ n: 100, batchSize: 10, timeDelay: 0 })
}
run()