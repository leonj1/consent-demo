.PHONY: start stop restart build test

MUSIC_PORT ?= 8000

build:
	docker build -t music-service music-service/

start: build
	docker-compose up -d
	docker run -d --name music-service -p $(MUSIC_PORT):8000 music-service

stop:
	docker-compose down
	docker stop -t 0 music-service || true
	docker rm -f music-service || true

restart: stop start

test:
	cd bank-service && python -m pytest -v
