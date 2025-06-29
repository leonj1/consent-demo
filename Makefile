.PHONY: start stop restart build test push push-dev version

# Include .env file if it exists
-include .env
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_SESSION_TOKEN
export AWS_REGION

# Port configuration
MUSIC_PORT ?= 8101
BANK_PORT ?= 8201
MUSIC_UI_PORT ?= 8100
BANK_UI_PORT ?= 8200

# ECR configuration
ECR_REGISTRY = 945513556588.dkr.ecr.us-east-1.amazonaws.com
ECR_MUSIC_SERVICE = consent-demo/music-service
ECR_BANK_SERVICE = consent-demo/bank-service
ECR_MUSIC_SERVICE_UI = consent-demo/music-service-ui
ECR_BANK_SERVICE_UI = consent-demo/bank-service-ui

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
	
	@echo "Pushing music-service with version $(VERSION)..."
	docker tag music-service:latest $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE):$(VERSION)
	docker tag music-service:latest $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE):latest
	docker push $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE):$(VERSION)
	docker push $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE):latest
	
	@echo "Pushing bank-service with version $(VERSION)..."
	docker tag bank-service:latest $(ECR_REGISTRY)/$(ECR_BANK_SERVICE):$(VERSION)
	docker tag bank-service:latest $(ECR_REGISTRY)/$(ECR_BANK_SERVICE):latest
	docker push $(ECR_REGISTRY)/$(ECR_BANK_SERVICE):$(VERSION)
	docker push $(ECR_REGISTRY)/$(ECR_BANK_SERVICE):latest
	
	@echo "Pushing music-service-ui with version $(VERSION)..."
	docker tag music-service-ui:latest $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE_UI):$(VERSION)
	docker tag music-service-ui:latest $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE_UI):latest
	docker push $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE_UI):$(VERSION)
	docker push $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE_UI):latest
	
	@echo "Pushing bank-service-ui with version $(VERSION)..."
	docker tag bank-service-ui:latest $(ECR_REGISTRY)/$(ECR_BANK_SERVICE_UI):$(VERSION)
	docker tag bank-service-ui:latest $(ECR_REGISTRY)/$(ECR_BANK_SERVICE_UI):latest
	docker push $(ECR_REGISTRY)/$(ECR_BANK_SERVICE_UI):$(VERSION)
	docker push $(ECR_REGISTRY)/$(ECR_BANK_SERVICE_UI):latest
	
	@echo "All images pushed successfully to ECR with version $(VERSION)!"

push-dev: build
	@echo "Building development version: dev-$(BRANCH)-$(SHORT_HASH)"
	@echo "Authenticating with AWS ECR..."
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REGISTRY)
	
	@echo "Pushing music-service (dev)..."
	docker tag music-service:latest $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE):dev-$(BRANCH)-$(SHORT_HASH)
	docker push $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE):dev-$(BRANCH)-$(SHORT_HASH)
	
	@echo "Pushing bank-service (dev)..."
	docker tag bank-service:latest $(ECR_REGISTRY)/$(ECR_BANK_SERVICE):dev-$(BRANCH)-$(SHORT_HASH)
	docker push $(ECR_REGISTRY)/$(ECR_BANK_SERVICE):dev-$(BRANCH)-$(SHORT_HASH)
	
	@echo "Pushing music-service-ui (dev)..."
	docker tag music-service-ui:latest $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE_UI):dev-$(BRANCH)-$(SHORT_HASH)
	docker push $(ECR_REGISTRY)/$(ECR_MUSIC_SERVICE_UI):dev-$(BRANCH)-$(SHORT_HASH)
	
	@echo "Pushing bank-service-ui (dev)..."
	docker tag bank-service-ui:latest $(ECR_REGISTRY)/$(ECR_BANK_SERVICE_UI):dev-$(BRANCH)-$(SHORT_HASH)
	docker push $(ECR_REGISTRY)/$(ECR_BANK_SERVICE_UI):dev-$(BRANCH)-$(SHORT_HASH)
	
	@echo "Development images pushed with tag: dev-$(BRANCH)-$(SHORT_HASH)"

version:
	@echo "Current version: $(VERSION)"
	@echo "Branch: $(BRANCH)"
	@echo "Commit: $(SHORT_HASH)"
	@echo "Tagged: $(IS_TAGGED)"
