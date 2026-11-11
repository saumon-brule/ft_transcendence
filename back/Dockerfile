# syntax=docker/dockerfile:1

ARG NODE_VERSION=26

FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    npm_config_store_dir=/pnpm/store \
    CI=true
WORKDIR /app
COPY package.json ./
RUN npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")"


FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY shared/package.json shared/
COPY back/package.json back/
COPY provider/package.json provider/
COPY front/package.json front/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @flex/back...

COPY tsconfig.base.json tsconfig.node.json ./
COPY shared shared
COPY back back
RUN pnpm --filter @flex/shared run build \
 && pnpm --filter @flex/back exec prisma generate \
 && pnpm --filter @flex/back run build
RUN pnpm --filter @flex/back deploy --prod /out


FROM node:${NODE_VERSION}-slim AS runtime
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /data/uploads /data/logs && chown -R node:node /data

WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json /out/prisma.config.ts ./
COPY --from=build /out/prisma ./prisma
COPY --from=build /out/assets ./assets
COPY --from=build /app/back/dist ./dist

COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER node
ENV PORT=3001 \
    UPLOADS_DIR=/data/uploads \
    LOG_DIR=/data/logs
EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
