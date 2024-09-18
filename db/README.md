# db

This directory contains database configuration, including and especially the database migrations.

Run the migrations with [flyway](https://documentation.red-gate.com/flyway/flyway-cli-and-api/welcome-to-flyway), which can be installed with Homebrew.

This directory includes config for connecting to the local database, and is run as part of the start script.

`flyway migrate`

Instructions for connecting to our pre-production and production databases are contained elsewhere.
