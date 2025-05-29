#!/bin/bash

# Test script to validate Identity Server client credentials setup

set -e

IDENTITY_SERVER_URL="http://localhost:9980"

echo "Testing Duende Identity Server token endpoint..."

# Function to test client credentials flow
test_client_credentials() {
    local client_id="$1"
    local client_secret="$2"
    local scope="$3"
    local service_name="$4"
    
    echo ""
    echo "=== Testing $service_name ==="
    echo "Client ID: $client_id"
    echo "Scope: $scope"
    
    response=$(curl -s -X POST "$IDENTITY_SERVER_URL/connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=client_credentials&client_id=$client_id&client_secret=$client_secret&scope=$scope" \
        -w "\nHTTP_CODE:%{http_code}")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "200" ]; then
        echo "✅ SUCCESS: Token obtained"
        access_token=$(echo "$body" | jq -r '.access_token // empty')
        token_type=$(echo "$body" | jq -r '.token_type // empty')
        expires_in=$(echo "$body" | jq -r '.expires_in // empty')
        
        if [ -n "$access_token" ] && [ "$access_token" != "null" ]; then
            echo "Token Type: $token_type"
            echo "Expires In: $expires_in seconds"
            echo "Access Token (first 50 chars): ${access_token:0:50}..."
            
            # Decode JWT header and payload for validation
            if command -v base64 >/dev/null 2>&1; then
                header=$(echo "$access_token" | cut -d. -f1)
                payload=$(echo "$access_token" | cut -d. -f2)
                
                # Add padding if needed for base64 decoding
                while [ $((${#header} % 4)) -ne 0 ]; do header="${header}="; done
                while [ $((${#payload} % 4)) -ne 0 ]; do payload="${payload}="; done
                
                echo "JWT Header:"
                echo "$header" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "Could not decode header"
                echo "JWT Payload:"
                echo "$payload" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "Could not decode payload"
            fi
        else
            echo "❌ WARNING: No access token in response"
            echo "Response: $body"
        fi
    else
        echo "❌ FAILED: HTTP $http_code"
        echo "Response: $body"
    fi
}

# Check if Identity Server is running
echo "Checking Identity Server availability..."
if ! curl -f -s "$IDENTITY_SERVER_URL/.well-known/openid_configuration" > /dev/null 2>&1; then
    echo "❌ ERROR: Identity Server is not available at $IDENTITY_SERVER_URL"
    echo "Make sure to run 'make start' first to start the Identity Server"
    exit 1
fi

echo "✅ Identity Server is available"

# Test Music API client
test_client_credentials \
    "music-api-client" \
    "music-api-secret-2024" \
    "music.api" \
    "Music Service"

# Test Bank API client
test_client_credentials \
    "bank-api-client" \
    "bank-api-secret-2024" \
    "bank.api" \
    "Bank Service"

echo ""
echo "=== Discovery Document ==="
echo "OpenID Configuration: $IDENTITY_SERVER_URL/.well-known/openid_configuration"

if command -v jq >/dev/null 2>&1; then
    echo ""
    echo "Available endpoints:"
    curl -s "$IDENTITY_SERVER_URL/.well-known/openid_configuration" | jq '{
        issuer,
        token_endpoint,
        authorization_endpoint,
        userinfo_endpoint,
        jwks_uri
    }'
else
    echo ""
    echo "Install 'jq' to see formatted discovery document"
fi

echo ""
echo "Testing complete!"