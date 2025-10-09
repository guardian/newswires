#!/bin/bash
set -e
echo "🔍 Checking to see if the database is up"
if docker compose -f docker-compose.yml ps | grep -q "newswires-db.*Up"; then
  echo "✅ Database is already running"
  if ./db/flyway.sc info local | grep -q "PENDING"; then
    echo "🚀 Applying migrations..."
    yes | ./db/flyway.sc migrate local
  else
    echo "✅ Migrations are already applied"
  fi
else
    echo "🔧 Starting test database..."
    docker compose -f docker-compose.yml up -d --wait
    echo "🚀 Applying migrations..."
    yes | ./db/flyway.sc migrate local
fi
