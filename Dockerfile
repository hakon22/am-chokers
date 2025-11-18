FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Этап сборки server
FROM node:22-alpine AS server-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Этап сборки sender
FROM node:22-alpine AS sender-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Сборка sender
RUN cd microservices/sender && npx tsc

# Финальные образы
FROM node:22-alpine AS server
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/microservices/sender ./microservices/sender
COPY --from=server-builder /app/src ./src
COPY --from=server-builder /app/package.json ./
COPY --from=server-builder /app/tsconfig.json ./
COPY --from=server-builder /app/public ./public
EXPOSE 3010
CMD ["npm", "run", "start:server:prod"]

FROM node:22-alpine AS sender
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=sender-builder /app/server ./server
COPY --from=sender-builder /app/microservices/sender ./microservices/sender
COPY --from=sender-builder /app/src ./src
COPY --from=sender-builder /app/package.json ./
COPY --from=sender-builder /app/tsconfig.json ./
CMD ["npm", "run", "start:sender:prod"]