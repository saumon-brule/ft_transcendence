# Production stacks (Docker only). Development uses pnpm, see the scripts of package.json and the README.
#
#   make secrets-server                  secrets/server/ and .env (from .env.example)
#   make server | server-down | server-logs | server-reset
#
#   make secrets-provider NAME=<name>    secrets/provider-<name>/ and .env.provider-<name> (from .env.provider.example)
#   make provider NAME=<name>            one provider per name, several can run on the same machine
#   make provider-down | provider-logs | provider-reset NAME=<name>

PROVIDER_PROJECT = flex-provider-$(NAME)
PROVIDER_COMPOSE = PROVIDER_NAME=$(NAME) docker compose -p $(PROVIDER_PROJECT) -f docker-compose.provider.yml --env-file .env.provider-$(NAME)

# NAME is required by every provider target: lowercase letters, digits and dashes
define provider_check
@test -n "$(NAME)" || { echo "NAME is required: make $@ NAME=<provider name>"; exit 1; }
@echo "$(NAME)" | grep -Eq '^[a-z0-9][a-z0-9-]*$$' || { echo "NAME must contain only lowercase letters, digits and dashes"; exit 1; }
endef

define provider_env_check
$(provider_check)
@test -f .env.provider-$(NAME) || { echo ".env.provider-$(NAME) is missing: run make secrets-provider NAME=$(NAME) to create it"; exit 1; }
endef

secrets-server:
	@docker/make-secrets.sh server

secrets-provider:
	$(provider_check)
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

provider-reset:
	@test "$(CONFIRM)" = "yes" || { echo "This deletes the database and the media of the provider $(NAME). Run: make provider-reset NAME=$(NAME) CONFIRM=yes"; exit 1; }
	$(provider_env_check)
	@$(PROVIDER_COMPOSE) down
	@docker volume rm -f $(PROVIDER_VOLUMES)

.PHONY: secrets-server secrets-provider server provider server-down provider-down server-logs provider-logs server-reset provider-reset
