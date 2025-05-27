.PHONY: start stop restart build test

MUSIC_PORT ?= 8101
BANK_PORT ?= 8201
MUSIC_UI_PORT ?= 8100
BANK_UI_PORT ?= 8200

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
