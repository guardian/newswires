# Fingerpost Queueing Lambda

A Lambda function that's invoked by incoming items on the Fingerpost SNS topic, and is responsible for persisting them to S3 and then adding them to the 'source queue' for the Ingestion Lambda.
