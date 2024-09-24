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
