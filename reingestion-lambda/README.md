# Reingestion Lambda

This is a one off script to recompute category codes. 

Currently this is a CODE only app that has been used to validate a change to the ingestion app. Though it could perhaps form the basis of a more general recomputation process if a use-case drives it.

To run.

Locally from the root of the project
```bash
  ./scripts/setup-local-db.sh
  npm run dev -w reingestion-lambda
```