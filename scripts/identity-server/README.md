# Identity Server Setup Scripts

This directory contains scripts to set up and test Duende Identity Server client credentials for the Music and Bank APIs.

## Scripts

### `setup-clients.sh`
Creates client credential configurations for:
- **Music API Client** (`music-api-client`)
- **Bank API Client** (`bank-api-client`)

### `test-tokens.sh`
Tests the client credentials flow by:
- Checking Identity Server availability
- Requesting access tokens for both clients
- Validating JWT tokens
- Displaying endpoint information

## Usage

1. **Start the services:**
   ```bash
   make start
   ```

2. **Set up clients:**
   ```bash
   chmod +x scripts/identity-server/setup-clients.sh
   ./scripts/identity-server/setup-clients.sh
   ```

3. **Test token acquisition:**
   ```bash
   chmod +x scripts/identity-server/test-tokens.sh
   ./scripts/identity-server/test-tokens.sh
   ```

## Client Configurations

### Music API Client
- **Client ID:** `music-api-client`
- **Client Secret:** `music-api-secret-2024`
- **Grant Type:** `client_credentials`
- **Scopes:** `music.api`, `music.read`, `music.write`

### Bank API Client
- **Client ID:** `bank-api-client`
- **Client Secret:** `bank-api-secret-2024`
- **Grant Type:** `client_credentials`
- **Scopes:** `bank.api`, `bank.read`, `bank.write`, `bank.transactions`

## Token Endpoint

```
POST http://localhost:9980/connect/token
Content-Type: application/x-www-form-urlencoded
```

### Example Request (Music API)
```bash
curl -X POST http://localhost:9980/connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&client_id=music-api-client&client_secret=music-api-secret-2024&scope=music.api'
```

### Example Request (Bank API)
```bash
curl -X POST http://localhost:9980/connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&client_id=bank-api-client&client_secret=bank-api-secret-2024&scope=bank.api'
```

## Response Format

Successful token response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "music.api"
}
```

## Notes

- Identity Server runs on port 9980
- Tokens are JWT format with RS256 signing
- Default token expiration is 1 hour (3600 seconds)
- Use Bearer token authentication with APIs

## Troubleshooting

1. **Identity Server not available:**
   - Ensure Docker Compose is running: `make start`
   - Check container status: `docker ps`

2. **Token request fails:**
   - Verify client configuration in Identity Server
   - Check client ID and secret are correct
   - Ensure requested scopes are allowed

3. **JWT token invalid:**
   - Check token expiration
   - Verify signing keys match
   - Ensure correct audience and issuer