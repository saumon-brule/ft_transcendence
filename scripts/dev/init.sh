#!/bin/sh
# Prepares the development environment: database in Docker, Prisma clients, migrations, test accounts.
# Run by "pnpm run dev" (and alone with "pnpm run dev:init").
set -e
cd "$(dirname "$0")/../.."

mkdir -p back/uploads/avatars back/uploads/cover
mkdir -p /tmp/flex-db
docker compose -f scripts/dev/docker-compose.yml up -d --wait

pnpm --filter @flex/back exec prisma generate
pnpm --filter @flex/back exec prisma migrate deploy
pnpm --filter @flex/provider exec prisma generate
pnpm --filter @flex/provider exec prisma migrate deploy

pnpm --filter @flex/back run seed:accounts
