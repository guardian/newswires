echo "🔧 Starting test database..."
docker compose -f ../docker-compose.test.yml up -d --wait 
echo "🚀 Applying migrations..."
yes | .././db/flyway.sc migrate test