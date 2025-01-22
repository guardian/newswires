#!/bin/bash

# Configuration
SCOPES="https://api.thomsonreuters.com/auth/reutersconnect.contentapi.read https://api.thomsonreuters.com/auth/reutersconnect.contentapi.write"
AUTH_URL="https://auth.thomsonreuters.com/oauth/token"
GRANT_TYPE="client_credentials"
AUDIENCE="7a14b6a2-73b8-4ab2-a610-80fb9f40f769"

# Check if item ID is provided
if [ -z "$1" ]; then
    echo "Please provide an item id"
    exit 1
fi

ITEM_ID="$1"

CREDENTIALS=$(
aws secretsmanager get-secret-value \
    --region eu-west-1 \
    --profile editorial-feeds \
    --secret-id /CODE/editorial-feeds/newswires/reuters_poller_lambda \
    --query SecretString \
    --output text
)
CLIENT_ID=$(echo "$CREDENTIALS" | jq -r '.CLIENT_ID')
CLIENT_SECRET=$(echo "$CREDENTIALS" | jq -r '.CLIENT_SECRET')

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "Failed to retrieve credentials from AWS Secrets Manager; check you have valid credentials stored"
    exit 1
fi

# Create GraphQL query
QUERY=$(cat <<EOF
query ItemDetailQuery {
  item(id: "${ITEM_ID}") {
    byLine
    copyrightNotice
    versionCreated
    fragment
    headLine
    versionedGuid
    uri
    language
    type
    profile
    slug
    usageTerms
    usageTermsRole
    version
    credit
    firstCreated
    productLabel
    pubStatus
    urgency
    usn
    position
    intro
    bodyXhtml
    bodyXhtmlRich
    subject {
        code
        name
        rel
    }
  }
}
EOF
)

# Get auth token
AUTH_RESPONSE=$(curl -s -X POST "$AUTH_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "grant_type=$GRANT_TYPE" \
    --data-urlencode "client_id=$CLIENT_ID" \
    --data-urlencode "client_secret=$CLIENT_SECRET" \
    --data-urlencode "audience=$AUDIENCE" \
    -d "scope=$SCOPES")

ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.access_token')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Failed to get auth token from Reuters"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

# Make GraphQL request
echo "Fetching content..."

REQUEST_PAYLOAD="{\"query\": $(echo "$QUERY" | jq -sR)}"

# Make the request and store the response
RESPONSE=$(curl -s -v -X POST "https://api.reutersconnect.com/content/graphql" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "$REQUEST_PAYLOAD")

# Check if we got a response
if [ -z "$RESPONSE" ]; then
    echo "No response received from the GraphQL endpoint"
    exit 1
fi

# Try to parse the response as JSON and output it
echo "$RESPONSE" | jq '.' || echo "Raw response (invalid JSON): $RESPONSE"