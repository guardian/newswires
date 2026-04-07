# db

This directory contains database configuration, including and especially the database migrations.

Run the migrations with a scala-cli script, `flyway.sc`, which wraps the [flyway](https://documentation.red-gate.com/flyway/flyway-cli-and-api/welcome-to-flyway)
API. Install scala-cli with Homebrew:

```sh
brew install Virtuslab/scala-cli/scala-cli
```

Then you can inspect the state of the database, and run any pending migrations, by running the script directly.

```sh
./flyway.sc info local      # to see which migrations have been applied
./flyway.sc migrate local   # to run all pending migrations
```

Change the `local` in the above commands for `code` or `prod` to run against the remote databases. Remember you'll need to have set up a tunnel to connect to those databases using [ssm-scala](https://github.com/guardian/ssm-scala).

The local migrations are run as part of the start script.

## Inspecting the CODE database locally

Create an SSH tunnel from your local machine to the AWS RDS instance
(needs [Janus](https://janus.gutools.co.uk/credentials?permissionId=editorial-feeds-dev) credentials):

```bash
ssm ssh -t newswires,CODE -p editorial-feeds -x --newest --rds-tunnel 5432:newswires,CODE;
```

Use the AWS CLI to create a DB auth token that can be used as the Postgres user password:

```bash
export PGPASSWORD="$(aws rds generate-db-auth-token --hostname "editorial-feeds-code-news-newswiresdbnewswires2a5a-njegkufriaaa.crdxssezsfsx.eu-west-1.rds.amazonaws.com" --port 5432 --username postgres --profile editorial-feeds --region eu-west-1)";
```

Finally, connect to the database (note that the `psql` client can be installed with
[`brew install libpq`](https://formulae.brew.sh/formula/libpq)):

```bash
psql "host=localhost port=5432 dbname=newswires user=postgres"
```

### GUI DB explorer tools

IntelliJ has a built-in DB explorer that offers an alternative to `psql`'s text-interface.

You can use the same `aws rds generate-db-auth-token` command to generate the password, but
note that the newline needs to be removed from the end:

```bash
aws rds generate-db-auth-token --hostname "editorial-feeds-code-news-newswiresdbnewswires2a5a-njegkufriaaa.crdxssezsfsx.eu-west-1.rds.amazonaws.com" --port 5432 --username postgres --profile editorial-feeds --region eu-west-1 | tr -d '\n' | pbcopy
```

This video shows how to create the Data Source in IntelliJ with the necessary settings:

https://github.com/user-attachments/assets/7e60b2d9-906c-4a99-9109-e6019425cd56
