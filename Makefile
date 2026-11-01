init:
	@mkdir -p /tmp/flex-db
	@docker compose up -d --wait
	@mkdir -p ./back/uploads/avatars
	@mkdir -p ./back/uploads/playlists
	@cd back && pnpm prisma generate && pnpm prisma migrate dev --name init && cd ..
	@cd provider && pnpm prisma generate && pnpm prisma migrate dev --name init && cd ..

run: init
	pnpm run dev

provider: init
	pnpm run dev:provider

migrate:
	@cd back && pnpm prisma migrate dev --name init && cd ..
	@cd provider && pnpm prisma migrate dev --name init && cd ..

genkey:
	@openssl genrsa -out back/provider.pem 2048

.PHONY: run init migrate genkey


