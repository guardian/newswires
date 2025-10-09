# Reingestion Lambda

This is a one off script to recompute category codes. 

Currently this is a CODE only app that has been used to validate a change to the ingestion app. Though it could perhaps form the basis of a more general recomputation process if a use-case drives it.

There is a `last_updated_at` time field in the database that is updated when a recompuation happens.

To run.

Locally from the root of the project
```bash
  ./scripts/setup-local-db.sh
  npm run dev -w reingestion-lambda
```

Running on CODE:
Go to the lambda interface and run:

`
    {
    "limit": 120000,
    "batchSize": 2000,
    "timeDelay": 5000,
    }
`
where limit is the cut off for the number of records to execute on.
The batch size is the size of how much to chunk the overall task by
TimeDelay is the length of time to wait between computations.

There are also optional parameters to query on:

lastUpdatedSince
- filter for records where `last_updated_at` is after a certain time

lastUpdatedUntil
- filter for records where `last_updated_at` is before a certain time

lastUpdatedAtIsEmpty
- when true filter for records where `last_updated_at` is null
- when false filter for records where `last_updated_at` is not ull