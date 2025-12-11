install:
	npm ci

start:
	pm2 start "npm run start:server:prod" -n am-chokers

start-sender:
	pm2 start "npm run start:sender:prod" -n am-chokers-sender

api:
	npm run start:server:dev

sender:
	npm run start:sender:dev

start-local-prod:
	npm run dev-prod

build:
	-pm2 delete am-chokers && rm -rf .next && npm run migration:run:prod && NODE_OPTIONS=--max-old-space-size=8192 npm run build

update-fids:
	cross-env DB='LOCAL' CRON='TRUE' tsx cron/update-fids.ts

fetch-clicks:
	cross-env DB='LOCAL' CRON='TRUE' tsx cron/yandex-direct.service.ts