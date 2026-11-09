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
    pnpm install --frozen-lockfile --filter @flex/front...

COPY tsconfig.base.json tsconfig.node.json ./
COPY shared shared
COPY front front
ARG VITE_API_URL
ARG VITE_DEFAULT_LANG
RUN pnpm --filter @flex/shared run build \
 && pnpm --filter @flex/front run build


FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY front/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/front/dist /usr/share/nginx/html
EXPOSE 80 443
