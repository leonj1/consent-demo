.PHONY: start stop restart build test

MUSIC_PORT ?= 8000
BANK_PORT ?= 8001

build:
	docker build -t music-service music-service/
	docker build -t bank-service bank-service/

start: build
	docker-compose up -d
	docker run -d --name music-service -p $(MUSIC_PORT):8000 music-service
	docker run -d --name bank-service -p $(BANK_PORT):8001 bank-service

stop:
	docker-compose down
	docker stop -t 0 music-service || true
	docker rm -f music-service || true
	docker stop -t 0 bank-service || true
	docker rm -f bank-service || true

restart: stop start

test:
	cd bank-service && python -m pytest -v
