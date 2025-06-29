# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a consent demonstration application showcasing OAuth2/OpenID Connect authentication using Duende Identity Server. It consists of two microservices (Bank and Music) with React frontends, demonstrating token-based authentication and authorization patterns.

## Architecture

- **Bank Service** (Python/FastAPI) - External port 8201, Internal port 8001
- **Bank Service UI** (React) - Port 8200  
- **Music Service** (Python/FastAPI) - External port 8101, Internal port 8000
- **Music Service UI** (React) - Port 8100
- **Identity Server** (Duende) - Port 9980
  - Discovery: http://localhost:9980/.well-known/openid_configuration
  - Token endpoint: http://localhost:9980/connect/token
- **PostgreSQL** (for Identity Server) - username=identityserver, password=password
- **SQLite** (for each service) - bank.db, music.db
- **Docker Network**: consent-demo-network (bridge)

## Essential Commands

### Development
```bash
# Build all services
make build

# Start all services (builds first)
make start

# Stop all services
make stop

# Restart all services
make restart

# Run all tests
make test

# Run tests for specific service
cd bank-service && python -m pytest -v
cd music-service && python -m pytest -v

# Run individual test
cd bank-service && python -m pytest -v tests/test_customers.py::test_create_customer

# Setup identity server clients
./scripts/identity-server/setup-clients.sh

# Test identity server token acquisition
./scripts/identity-server/test-tokens.sh

# Setup ECR repositories (run once before first push)
./scripts/aws/setup-ecr-repos.sh

# Push all Docker images to AWS ECR
make push

# Push development version (for feature branches)
make push-dev

# Display current version information
make version
```

### Frontend Development
```bash
# In music-service-ui/ or bank-service-ui/
npm install        # Install dependencies
npm start          # Start dev server
npm test           # Run tests
npm run build      # Build for production
```

## Key Development Patterns

### API Structure
- FastAPI endpoints follow RESTful patterns
- All endpoints require Bearer token authentication
- Response models use Pydantic for validation
- Error responses include error_code and error_message

### Authentication Flow
1. Client credentials flow with Duende Identity Server
2. Music API: 
   - Client ID: `music-api-client`
   - Client Secret: `music-api-secret-2024`
   - Scopes: music.api, music.read, music.write
3. Bank API: 
   - Client ID: `bank-api-client`
   - Client Secret: `bank-api-secret-2024`
   - Scopes: bank.api, bank.read, bank.write, bank.transactions

### Testing
- Backend: pytest with SQLAlchemy test fixtures
- Frontend: React Testing Library
- All services have comprehensive test coverage

## Technical Stack

### Backend
- Python 3.11
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- Pydantic 2.5.0
- pytest 7.4.3

### Frontend
- React 18.2
- Tailwind CSS 3.x
- React Scripts 5.0.1

## Important Notes

- Each service runs in its own Docker container
- Services use SQLite databases (bank.db, music.db)
- Identity Server uses PostgreSQL
- Frontend apps proxy API requests to backend services
- All builds and tests must pass before committing changes
- Environment variables can be configured using .env file (see .env.example)

## AWS ECR Deployment

### Repository Structure
Each service has its own ECR repository:
- `945513556588.dkr.ecr.us-east-1.amazonaws.com/consent-demo/music-service`
- `945513556588.dkr.ecr.us-east-1.amazonaws.com/consent-demo/bank-service`
- `945513556588.dkr.ecr.us-east-1.amazonaws.com/consent-demo/music-service-ui`
- `945513556588.dkr.ecr.us-east-1.amazonaws.com/consent-demo/bank-service-ui`

### Versioning Strategy
- **Production (master branch)**: Semantic versioning with git tags (e.g., `v1.2.3`)
  - Tags are automatically created when pushing to master via GitHub Actions
  - Each push to master bumps the patch version by default
- **Development branches**: Tagged as `dev-<branch>-<commit-hash>`
- A `latest` tag always points to the most recent production version
- Lifecycle policies automatically retain only the 5 most recent images

### Version Management
- `make version` - Display current version information
- `make push` - Push production images (warns if not on tagged commit)
- `make push-dev` - Push development images with branch information
- GitHub Actions automatically creates version tags on master pushes

### First-time Setup
Before pushing images for the first time:
1. Ensure AWS credentials are in `.env` file
2. Run `./scripts/aws/setup-ecr-repos.sh` to create repositories and lifecycle policies
3. Use `make push` to build and push all images