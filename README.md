<sup>Looking for the repository containing the current Fingerpost wires? Try [editorial-wires](https://github.com/guardian/editorial-wires) instead (Guardian employees only, sorry!)</sup>

# Newswires

For more details, see

- [`poller-lambdas` README](poller-lambdas/README.md)

## Running locally

Before running any of the projects locally, run the setup script to check dependencies and configure the local environment:

```sh
./scripts/setup
```

### Newswires (API and UI)

This can either be run against the CODE database, or against a local database (requires Docker). Both options currently require
having AWS credentials configured, to allows for fetching [pan-domain-auth](https://github.com/guardian/pan-domain-authentication)
keys and -- when run with the `--use-CODE` flag -- tunnelling to the CODE database.

```sh
# Running against the CODE db
./scripts/start --use-CODE
```

```sh
# Running against a local db (requires Docker)
./scripts/start
```

### Finger post queueing lambda
```sh
docker compose up
npm run dev -w fingerpost-queueing-lambda
```

### Ingestion Lambda

```sh
docker compose up
npm run dev -w ingestion-lambda
```

### Poller Lambdas

```sh
npm run dev -w poller-lambdas
```

...and follow the interactive prompts for running different poller lambdas logic (including simulating the self-queuing mechanism).

## Adding a new poller lambda

See [poller-lambdas/README.md](poller-lambdas/README.md)

## Architecture overview

```mermaid
graph TB
    %% External Sources
    Reuters[Reuters Feed]
    AP[AP Feed]
    Fingerpost[Fingerpost Feed]
    Users[Users]

    subgraph AWS["AWS 'editorial-feeds'"]
        subgraph WritePath["Ingestion"]
            %% Lambda Functions for ingestion
            ReutersPoller[Reuters Poller Lambda]
            APPoller[AP Poller Lambda]
            Ingestion[Ingestion Lambda]

            %% Queues and Topics
            FingerpostSNS[Fingerpost SNS]
            FingerpostQueueingLambda[Fingerpost Queueing Lambda]
            SourceQ[/Source Queue/]

            %% Ingestion flows
            ReutersPoller --> SourceQ
            APPoller --> SourceQ
            FingerpostQueueingLambda --> SourceQ
            SourceQ --> Ingestion
            Ingestion --> FeedsBucket
        end

        subgraph ReadPath["User-facing app"]
            %% Web Application
            ASG[EC2 Auto Scaling Group]
            ALB[Application Load Balancer]

            %% Read path flows
            ALB --> ASG
        end

        %% Shared Resources
        FeedsBucket[(Feeds S3 Bucket)]
        DB[(PostgreSQL RDS)]
        Cleanup[Cleanup Lambda]

        %% Shared Resource Flows
        Ingestion --> DB
        ASG -- "read-only access" --> DB
        Cleanup -- "delete old stories on a schedule" --> DB
    end

    %% External Data Flows
    Reuters <-- "fixed schedule" --> ReutersPoller
    AP <-- "long polling" --> APPoller
    Fingerpost -- pushes --> FingerpostSNS
    FingerpostSNS --> FingerpostQueueingLambda
    Users --> ALB

    %% Styling
    classDef external stroke:#f9f
    classDef lambda stroke:#ff9
    classDef queue stroke:#9f9
    classDef storage stroke:#99f
    classDef compute stroke:#f96

    class Reuters,AP,Fingerpost,Users external
    class ReutersPoller,APPoller,Ingestion,Cleanup,FingerpostQueueingLambda lambda
    class SourceQ queue
    class FeedsBucket,DB storage
    class ASG,ALB compute
```
