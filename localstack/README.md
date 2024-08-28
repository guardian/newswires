# localstack

This folder contains the bootstrap scripts for [LocalStack](https://docs.localstack.cloud/overview/) that are run when LocalStack starts to set up the local AWS environment.

This folder is mounted to a specific location in the container filesystem by the configuration in [`docker-compose.yml`](../docker-compose.yml).

See https://docs.localstack.cloud/references/init-hooks/ for a description of how the hooks work.

