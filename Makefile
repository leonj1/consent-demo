.PHONY: start stop restart build test push push-dev version

# Include .env file if it exists
-include .env
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_SESSION_TOKEN

# Port configuration
MUSIC_PORT ?= 8101
BANK_PORT ?= 8201
MUSIC_UI_PORT ?= 8100
BANK_UI_PORT ?= 8200

# ECR configuration
AWS_ACCOUNT_ID := $(shell aws sts get-caller-identity --query 'Account' --output text 2>/dev/null || echo "000000000000")
AWS_REGION ?= us-east-1
export AWS_REGION
ECR_REGISTRY = $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com
ECR_REPOSITORY = my-app-repository

# Service names
SERVICES = music-service bank-service music-service-ui bank-service-ui

# Version detection using git tags
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "v0.0.0")
BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
SHORT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Determine if we're on a tagged commit
IS_TAGGED := $(shell git describe --exact-match --tags 2>/dev/null && echo "true" || echo "false")

build:
	docker build -t music-service music-service/
	docker build -t bank-service bank-service/
	docker build -t music-service-ui music-service-ui/
	docker build -t bank-service-ui bank-service-ui/

start: build
	docker-compose up -d
	docker run -d --name music-service -p $(MUSIC_PORT):8000 music-service
	docker run -d --name bank-service -p $(BANK_PORT):8001 bank-service
	docker run -d --name music-service-ui -p $(MUSIC_UI_PORT):80 music-service-ui
	docker run -d --name bank-service-ui -p $(BANK_UI_PORT):80 bank-service-ui

stop:
	docker-compose down
	docker stop -t 0 music-service || true
	docker rm -f music-service || true
	docker stop -t 0 bank-service || true
	docker rm -f bank-service || true
	docker stop -t 0 music-service-ui || true
	docker rm -f music-service-ui || true
	docker stop -t 0 bank-service-ui || true
	docker rm -f bank-service-ui || true

restart: stop start

test:
	cd bank-service && python -m pytest -v
	cd music-service && python -m pytest -v

push: build
	@if [ "$(IS_TAGGED)" = "false" ] && [ "$$CI" != "true" ]; then \
		echo "WARNING: Current commit is not tagged. Version will be $(VERSION)"; \
		echo "For production releases, push to master to create a version tag automatically."; \
		echo "Continue? [y/N] "; \
		read answer; \
		if [ "$$answer" != "y" ] && [ "$$answer" != "Y" ]; then \
			echo "Push cancelled."; \
			exit 1; \
		fi \
	fi
	
	@echo "Authenticating with AWS ECR..."
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REGISTRY)
	
	@for service in $(SERVICES); do \
		echo "Pushing $$service with version $(VERSION)..."; \
		docker tag $$service:latest $(ECR_REGISTRY)/$(ECR_REPOSITORY):$$service-$(VERSION); \
		docker tag $$service:latest $(ECR_REGISTRY)/$(ECR_REPOSITORY):$$service-latest; \
		docker push $(ECR_REGISTRY)/$(ECR_REPOSITORY):$$service-$(VERSION); \
		docker push $(ECR_REGISTRY)/$(ECR_REPOSITORY):$$service-latest; \
	done
	
	@echo "All images pushed successfully to ECR with version $(VERSION)!"

push-dev: build
	@echo "Building development version: dev-$(BRANCH)-$(SHORT_HASH)"
	@echo "Authenticating with AWS ECR..."
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REGISTRY)
	
	@for service in $(SERVICES); do \
		echo "Pushing $$service (dev)..."; \
		docker tag $$service:latest $(ECR_REGISTRY)/$(ECR_REPOSITORY):$$service-dev-$(BRANCH)-$(SHORT_HASH); \
		docker push $(ECR_REGISTRY)/$(ECR_REPOSITORY):$$service-dev-$(BRANCH)-$(SHORT_HASH); \
	done
	
	@echo "Development images pushed with tag: dev-$(BRANCH)-$(SHORT_HASH)"

version:
	@echo "Current version: $(VERSION)"
	@echo "Branch: $(BRANCH)"
	@echo "Commit: $(SHORT_HASH)"
	@echo "Tagged: $(IS_TAGGED)"
