# make provider NAME=1 runs a second provider: project flex-provider-1, settings in provider/.env.1,
# secrets in provider/secrets.1 (make secrets-provider NAME=1). Without NAME, the default one.
PROVIDER_PROJECT = flex-provider$(if $(NAME),-$(NAME))
PROVIDER_COMPOSE = PROVIDER_SECRETS_DIR=secrets$(if $(NAME),.$(NAME)) docker compose -p $(PROVIDER_PROJECT) -f provider/docker-compose.yml $(if $(NAME),--env-file provider/.env.$(NAME))

define provider_env_check
@test -z "$(NAME)" || test -f provider/.env.$(NAME) || { echo "provider/.env.$(NAME) is missing: copy provider/.env.example to it and change PROVIDER_PORT, PROVIDER_HTTP_PORT, PROVIDER_URL"; exit 1; }
endef

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
	@docker/make-secrets.sh provider $(NAME)

server:
	@docker compose up -d --build --wait

provider:
	$(provider_env_check)
	@$(PROVIDER_COMPOSE) up -d --build --wait

server-down:
	@docker compose down

provider-down:
	$(provider_env_check)
	@$(PROVIDER_COMPOSE) down

server-logs:
	@docker compose logs -f --tail=100

provider-logs:
	$(provider_env_check)
	@$(PROVIDER_COMPOSE) logs -f --tail=100

SERVER_VOLUMES = flex_postgres_data flex_uploads flex_logs
PROVIDER_VOLUMES = $(PROVIDER_PROJECT)_postgres_data $(PROVIDER_PROJECT)_media

server-reset:
	@test "$(CONFIRM)" = "yes" || { echo "This deletes the database, the uploads and the logs of the server stack. Run: make server-reset CONFIRM=yes"; exit 1; }
	@docker compose down
	@docker volume rm -f $(SERVER_VOLUMES)

server-seed:
	@docker compose run --rm back node dist/seed.js $(ARGS)

provider-seed:
	@case "$(ARGS)" in *--reset*) test "$(CONFIRM)" = "yes" || { echo "--reset wipes all musics, albums and artists. Run: make provider-seed ARGS=--reset CONFIRM=yes"; exit 1; };; esac
	$(provider_env_check)
	@$(PROVIDER_COMPOSE) run --rm -v "$(CURDIR)/provider/mock:/app/mock:ro" provider node dist/seed.js $(ARGS)

provider-reset:
	@test "$(CONFIRM)" = "yes" || { echo "This deletes the database and the media of the provider stack. Run: make provider-reset CONFIRM=yes"; exit 1; }
	$(provider_env_check)
	@$(PROVIDER_COMPOSE) down
	@docker volume rm -f $(PROVIDER_VOLUMES)

genkey:
	@openssl genrsa -out back/provider.pem 2048

.PHONY: run init provider provider2 migrate migrate-back migrate-provider reset reset-back reset-provider server-reset server-seed provider-seed provider-reset genkey secrets secrets-server secrets-provider server provider server-down provider-down server-logs provider-logs

