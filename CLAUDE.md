# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a consent demonstration application showcasing OAuth2/OpenID Connect authentication using Duende Identity Server. It consists of two microservices (Bank and Music) with React frontends, demonstrating token-based authentication and authorization patterns.

## Architecture

- **Bank Service** (Python/FastAPI) - Port 8201
- **Bank Service UI** (React) - Port 8200  
- **Music Service** (Python/FastAPI) - Port 8101
- **Music Service UI** (React) - Port 8100
- **Identity Server** (Duende) - Port 9980
- **PostgreSQL** (for Identity Server)
- **SQLite** (for each service)

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
2. Music API: `music-api-client` with scopes: music.api, music.read, music.write
3. Bank API: `bank-api-client` with scopes: bank.api, bank.read, bank.write, bank.transactions

### Testing
- Backend: pytest with SQLAlchemy test fixtures
- Frontend: React Testing Library
- All services have comprehensive test coverage

## Important Notes

- Each service runs in its own Docker container
- Services use SQLite databases (bank.db, music.db)
- Identity Server uses PostgreSQL
- Frontend apps proxy API requests to backend services
- All builds and tests must pass before committing changes