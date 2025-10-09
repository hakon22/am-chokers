install:
	npm ci

start:
	pm2 start "npm run start" -n am-chokers

start-local:
	npm run dev

start-local-prod:
	npm run dev-prod

build:
	-pm2 delete am-chokers && rm -rf .next && npm run migration:run:prod && NODE_OPTIONS=--max-old-space-size=8192 npm run build

update-fids:
	cross-env DB='LOCAL' CRON='TRUE' tsx cron/update-fids.ts