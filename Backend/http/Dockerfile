# Build context must be the repo root (see docker-compose.yml) because this
# service imports the compiled Prisma wrapper from ../../db/dist at runtime
# via a relative path, so both packages need to live at the same relative
# layout inside the image as they do in the repo.

FROM node:20-alpine AS db-build
WORKDIR /repo/Backend/db
COPY Backend/db/package*.json ./
RUN npm ci
COPY Backend/db/ .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS http-build
WORKDIR /repo/Backend/http
COPY Backend/http/package*.json ./
RUN npm ci
COPY Backend/http/ .
# tsc resolves the "../../db/dist/index.js" import at compile time, so the
# already-built db package needs to exist at that relative path in this
# (otherwise isolated) build stage too.
COPY --from=db-build /repo/Backend/db /repo/Backend/db
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=db-build /repo/Backend/db/node_modules /repo/Backend/db/node_modules
COPY --from=db-build /repo/Backend/db/dist /repo/Backend/db/dist
COPY --from=db-build /repo/Backend/db/prisma /repo/Backend/db/prisma
COPY --from=db-build /repo/Backend/db/package.json /repo/Backend/db/package.json

COPY --from=http-build /repo/Backend/http/node_modules /repo/Backend/http/node_modules
COPY --from=http-build /repo/Backend/http/dist /repo/Backend/http/dist
COPY --from=http-build /repo/Backend/http/package.json /repo/Backend/http/package.json

WORKDIR /repo/Backend/http
EXPOSE 3001
CMD ["node", "dist/index.js"]
