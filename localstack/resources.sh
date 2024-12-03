#!/bin/bash

export AWS_DEFAULT_REGION=eu-west-1

# Create our  s3 for localstack
awslocal s3 mb s3://local-feeds-bucket || true

awslocal sqs create-queue --queue-name ingestion-lambda-queue || true
