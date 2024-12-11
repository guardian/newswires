<sup>Looking for the repository containing the current Fingerpost wires? Try [editorial-wires](https://github.com/guardian/editorial-wires) instead (Guardian employees only, sorry!)</sup>

# newswires

## Running locally

### Ingestion Lambda

```sh
docker compose up
npm run dev -w ingestion-lambda
```

### Newswires (API and UI)

```sh
pushd newswires
pushd client
npm i
popd
./scripts/setup
# setup the DB tunnel; TODO make this optional and offer a way to connect to a local DB
ssm ssh -t newswires,CODE -p editorial-feeds -x --newest --rds-tunnel 5432:newswires,CODE
sbt run
```

### Poller Lambdas
```sh
npm run dev -w poller-lambdas
```
...and follow the interactive prompts for running different poller lambdas logic (including simulating the self-queuing mechanism).

## Adding a new poller lambda

See [poller-lambdas/README.md](poller-lambdas/README.md)
