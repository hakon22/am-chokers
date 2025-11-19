FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Этап сборки server
FROM node:22-alpine AS server-builder
ARG NEXT_PUBLIC_PORT
ARG NEXT_PUBLIC_SERVER_HOST
ARG NEXT_PUBLIC_PRODUCTION_HOST
ARG NEXT_PUBLIC_API_PATH
ARG NEXT_PUBLIC_STORAGE_KEY
ARG NEXT_PUBLIC_LANGUAGE_KEY
ARG NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY
ARG NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT
ARG NEXT_PUBLIC_URL_TG_ACCOUNT
ARG NEXT_PUBLIC_URL_INST_ACCOUNT
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_WORK_PHONE
ARG NEXT_PUBLIC_CONTACT_MAIL
ARG NEXT_PUBLIC_FIO
ARG NEXT_PUBLIC_FIO_EN
ARG NEXT_PUBLIC_INN
ARG NEXT_PUBLIC_PROMO

ENV NEXT_PUBLIC_PORT=${NEXT_PUBLIC_PORT} \
    NEXT_PUBLIC_SERVER_HOST=${NEXT_PUBLIC_SERVER_HOST} \
    NEXT_PUBLIC_PRODUCTION_HOST=${NEXT_PUBLIC_PRODUCTION_HOST} \
    NEXT_PUBLIC_API_PATH=${NEXT_PUBLIC_API_PATH} \
    NEXT_PUBLIC_STORAGE_KEY=${NEXT_PUBLIC_STORAGE_KEY} \
    NEXT_PUBLIC_LANGUAGE_KEY=${NEXT_PUBLIC_LANGUAGE_KEY} \
    NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY=${NEXT_PUBLIC_NEW_ITEM_STORAGE_KEY} \
    NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT=${NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT} \
    NEXT_PUBLIC_URL_TG_ACCOUNT=${NEXT_PUBLIC_URL_TG_ACCOUNT} \
    NEXT_PUBLIC_URL_INST_ACCOUNT=${NEXT_PUBLIC_URL_INST_ACCOUNT} \
    NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME} \
    NEXT_PUBLIC_WORK_PHONE=${NEXT_PUBLIC_WORK_PHONE} \
    NEXT_PUBLIC_CONTACT_MAIL=${NEXT_PUBLIC_CONTACT_MAIL} \
    NEXT_PUBLIC_FIO=${NEXT_PUBLIC_FIO} \
    NEXT_PUBLIC_FIO_EN=${NEXT_PUBLIC_FIO_EN} \
    NEXT_PUBLIC_INN=${NEXT_PUBLIC_INN} \
    NEXT_PUBLIC_PROMO=${NEXT_PUBLIC_PROMO}
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY .env ./.env
RUN mkdir -p ./public
RUN npm run build

# Финальные образы
FROM node:22-alpine AS server
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=server-builder /app/cron ./cron
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/microservices/sender ./microservices/sender
COPY --from=server-builder /app/src ./src
COPY --from=server-builder /app/package.json ./
COPY --from=server-builder /app/tsconfig.json ./
COPY --from=server-builder /app/public ./public
COPY --from=server-builder /app/.next ./.next
EXPOSE 3010
CMD ["npm", "run", "start:server:prod"]

FROM node:22-alpine AS sender
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/microservices/sender ./microservices/sender
COPY --from=server-builder /app/src ./src
COPY --from=server-builder /app/package.json ./
COPY --from=server-builder /app/tsconfig.json ./
CMD ["npm", "run", "start:sender:prod"]