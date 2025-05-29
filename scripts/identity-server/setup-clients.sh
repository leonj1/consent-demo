#!/bin/bash

# Duende Identity Server Client Setup Script
# Creates client credentials for Music API and Bank API

set -e

IDENTITY_SERVER_URL="http://localhost:9980"
ADMIN_TOKEN=""

echo "Setting up Duende Identity Server clients..."

# Function to wait for Identity Server to be ready
wait_for_identity_server() {
    echo "Waiting for Identity Server to be ready..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$IDENTITY_SERVER_URL/.well-known/openid_configuration" > /dev/null 2>&1; then
            echo "Identity Server is ready!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: Identity Server not ready yet..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "ERROR: Identity Server failed to become ready after $max_attempts attempts"
    exit 1
}

# Function to create a client using the management API
create_client() {
    local client_id="$1"
    local client_name="$2"
    local scopes="$3"
    local client_secret="$4"
    
    echo "Creating client: $client_name ($client_id)"
    
    # Note: Duende Identity Server requires specific setup for client management
    # This is a simplified example - in production you'd use the proper management API
    cat > "/tmp/${client_id}_config.json" << EOF
{
  "ClientId": "$client_id",
  "ClientName": "$client_name",
  "ClientSecrets": [
    {
      "Value": "$client_secret"
    }
  ],
  "AllowedGrantTypes": [ "client_credentials" ],
  "AllowedScopes": [ $scopes ],
  "Claims": [
    {
      "Type": "client_id",
      "Value": "$client_id"
    }
  ]
}
EOF

    echo "Client configuration saved to /tmp/${client_id}_config.json"
}

# Wait for Identity Server to be available
wait_for_identity_server

echo ""
echo "Creating API clients..."

# Create Music API client
create_client \
    "music-api-client" \
    "Music Service API" \
    "\"music.api\", \"music.read\", \"music.write\"" \
    "music-api-secret-2024"

# Create Bank API client  
create_client \
    "bank-api-client" \
    "Bank Service API" \
    "\"bank.api\", \"bank.read\", \"bank.write\", \"bank.transactions\"" \
    "bank-api-secret-2024"

echo ""
echo "Client configurations created!"
echo ""
echo "=== Music API Client ==="
echo "Client ID: music-api-client"
echo "Client Secret: music-api-secret-2024"
echo "Scopes: music.api, music.read, music.write"
echo ""
echo "=== Bank API Client ==="
echo "Client ID: bank-api-client" 
echo "Client Secret: bank-api-secret-2024"
echo "Scopes: bank.api, bank.read, bank.write, bank.transactions"
echo ""
echo "=== Token Endpoint ==="
echo "POST $IDENTITY_SERVER_URL/connect/token"
echo "Content-Type: application/x-www-form-urlencoded"
echo ""
echo "Example curl for Music API:"
echo "curl -X POST $IDENTITY_SERVER_URL/connect/token \\"
echo "  -H 'Content-Type: application/x-www-form-urlencoded' \\"
echo "  -d 'grant_type=client_credentials&client_id=music-api-client&client_secret=music-api-secret-2024&scope=music.api'"
echo ""
echo "Example curl for Bank API:"
echo "curl -X POST $IDENTITY_SERVER_URL/connect/token \\"
echo "  -H 'Content-Type: application/x-www-form-urlencoded' \\"
echo "  -d 'grant_type=client_credentials&client_id=bank-api-client&client_secret=bank-api-secret-2024&scope=bank.api'"
echo ""

echo "NOTE: These client configurations need to be manually added to your Identity Server."
echo "The JSON files are saved in /tmp/ for reference."
echo "In a production setup, you would use the Identity Server management API or configuration files."