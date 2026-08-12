# One-shot migration runner: applies Prisma migrations against DATABASE_URL
# and exits. Used by docker-compose as an init step before the http service
# (which depends on the same Prisma-generated client) starts.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

CMD ["npx", "prisma", "migrate", "deploy"]
