#!/bin/bash

export AWS_DEFAULT_REGION=eu-west-1

# Create our  s3 for localstack
awslocal s3 mb s3://local-feeds-bucket || true
awslocal --endpoint-url=http://localhost:4566 sqs create-queue --queue-name local-ingestion-queue --region eu-west-1 --attributes VisibilityTimeout=30
