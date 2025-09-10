#!/bin/bash
set -e
echo "🔍 Checking to see if the database is up"
if docker compose -f docker-compose.test.yml ps | grep -q "newswires-test-db.*Up"; then
  echo "✅ Database is already running"
else
    echo "🔧 Starting test database..."
    docker compose -f docker-compose.test.yml up -d --wait
    echo "🚀 Applying migrations..."
    yes | ./db/flyway.sc migrate test
fi
