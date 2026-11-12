init:
	@mkdir -p /tmp/flex-db
	@docker compose -f docker-compose.dev.yml up -d --wait
	@mkdir -p ./back/uploads/avatars
	@mkdir -p ./back/uploads/cover
	@cd back && pnpm prisma generate && pnpm prisma migrate deploy && cd ..
	@cd provider && pnpm prisma generate && pnpm prisma migrate deploy && cd ..

dev: init
	pnpm run dev

migrate: migrate-back migrate-provider

provider1: init
	MOCK_DISCOGRAPHY=1 pnpm run dev:provider

provider2: init
	DOTENV_CONFIG_PATH=.env.provider2 pnpm --dir provider prisma migrate deploy
	DOTENV_CONFIG_PATH=.env.provider2 pnpm run dev:provider


migrate-back:
	@test -n "$(NAME)" || { echo "usage: make migrate-back NAME=what_you_changed"; exit 1; }
	@cd back && pnpm prisma migrate dev --name $(NAME)

migrate-provider:
	@test -n "$(NAME)" || { echo "usage: make migrate-provider NAME=what_you_changed"; exit 1; }
	@cd provider && pnpm prisma migrate dev --name $(NAME)

reset: reset-back reset-provider

reset-back:
	@cd back && pnpm prisma migrate reset --force

reset-provider:
	@cd provider && pnpm prisma migrate reset --force

secrets: secrets-server secrets-provider

secrets-server:
	@docker/make-secrets.sh server

secrets-provider:
	@docker/make-secrets.sh provider

server:
	@docker compose up -d --build --wait

provider:
	@docker compose -f provider/docker-compose.yml up -d --build --wait

server-down:
	@docker compose down

provider-down:
	@docker compose -f provider/docker-compose.yml down

server-logs:
	@docker compose logs -f --tail=100

provider-logs:
	@docker compose -f provider/docker-compose.yml logs -f --tail=100

SERVER_DB_VOLUME = flex_postgres_data
PROVIDER_DB_VOLUME = flex-provider_postgres_data

server-reset:
	@test "$(CONFIRM)" = "yes" || { echo "This deletes the database of the server stack. Run: make server-reset CONFIRM=yes"; exit 1; }
	@docker compose down
	@docker volume rm -f $(SERVER_DB_VOLUME)
	@docker compose up -d --wait

provider-seed:
	@case "$(ARGS)" in *--reset*) test "$(CONFIRM)" = "yes" || { echo "--reset wipes all musics, albums and artists. Run: make provider-seed ARGS=--reset CONFIRM=yes"; exit 1; };; esac
	@docker compose -f provider/docker-compose.yml run --rm -v "$(CURDIR)/provider/mock:/app/mock:ro" provider node dist/seed.js $(ARGS)

provider-reset:
	@test "$(CONFIRM)" = "yes" || { echo "This deletes the database of the provider stack. Run: make provider-reset CONFIRM=yes"; exit 1; }
	@docker compose -f provider/docker-compose.yml down
	@docker volume rm -f $(PROVIDER_DB_VOLUME)
	@docker compose -f provider/docker-compose.yml up -d --wait

genkey:
	@openssl genrsa -out back/provider.pem 2048

.PHONY: run init provider provider2 migrate migrate-back migrate-provider reset reset-back reset-provider server-reset provider-seed provider-reset genkey secrets secrets-server secrets-provider server provider server-down provider-down server-logs provider-logs

