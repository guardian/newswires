#!/bin/bash

export AWS_DEFAULT_REGION=eu-west-1
export EDGE_PORT=4566

awslocal s3 mb s3://local-feeds-bucket || true
awslocal --endpoint-url=http://localhost:$EDGE_PORT sqs create-queue --queue-name local-ingestion-queue --region $AWS_DEFAULT_REGION --attributes VisibilityTimeout=30

awslocal s3 mb s3://local-emails-bucket || true
