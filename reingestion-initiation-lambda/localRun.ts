import { main } from "./src/handler";
async function run() {
    main({ n: 4000, batchSize: 500 })
}
run()