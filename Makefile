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

migrate-back:
	@test -n "$(NAME)" || { echo "usage: make migrate-back NAME=what_you_changed"; exit 1; }
	@cd back && pnpm prisma migrate dev --name $(NAME)

migrate-provider:
	@test -n "$(NAME)" || { echo "usage: make migrate-provider NAME=what_you_changed"; exit 1; }
	@cd provider && pnpm prisma migrate dev --name $(NAME)

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

genkey:
	@openssl genrsa -out back/provider.pem 2048

.PHONY: run init provider migrate migrate-back migrate-provider genkey secrets secrets-server secrets-provider server provider server-down provider-down server-logs provider-logs

