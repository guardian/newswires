import router from "./src/router";
import { server } from "./src/server";

server(router).listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});