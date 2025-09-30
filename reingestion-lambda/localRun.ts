import { main } from "./src/handler";
async function run() {
    main({
        limit: 25,
        timeDelay: 1000
    })
}
run()