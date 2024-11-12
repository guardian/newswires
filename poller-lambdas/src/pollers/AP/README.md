# AP Poller

## Generating API types from swagger definition

The file `./apApi.ts` was generated from `ap-swagger.json` using the following command, run from the repo root:

```sh
npx swagger-typescript-api \
    -p ./poller-lambdas/src/pollers/AP/ap-swagger.json \
    -o ./poller-lambdas/src/pollers/AP/generated \
    -n apApi.ts \
    --union-enums \
    --extract-response-body \
    --extract-response-error \
    --extract-request-params \
    --extract-request-body \
    --disable-throw-on-error \
    --unwrap-response-data \
    --no-client
```