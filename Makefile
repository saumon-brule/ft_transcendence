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
	MOCK_DISCOGRAPHY=1 pnpm run dev:provider

# Second provider on port 3003, configured by provider/.env.provider2
provider2: init
	@cd provider && DOTENV_CONFIG_PATH=.env.provider2 pnpm prisma migrate dev --name init && cd ..
	DOTENV_CONFIG_PATH=.env.provider2 pnpm run dev:provider

migrate:
	@cd back && pnpm prisma migrate dev --name init && cd ..
	@cd provider && pnpm prisma migrate dev --name init && cd ..

genkey:
	@openssl genrsa -out back/provider.pem 2048

.PHONY: run init provider provider2 migrate genkey


