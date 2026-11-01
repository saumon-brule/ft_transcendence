init:
	@mkdir -p /tmp/flex-db
	@docker compose -f docker-compose.dev.yml up -d --wait
	@mkdir -p ./back/uploads/avatars
	@mkdir -p ./back/uploads/cover
	@cd back && pnpm prisma generate && pnpm prisma migrate deploy && cd ..
	@cd provider && pnpm prisma generate && pnpm prisma migrate deploy && cd ..

run: init
	pnpm run dev

provider: init
	pnpm run dev:provider

migrate-back:
	@test -n "$(NAME)" || { echo "usage: make migrate-back NAME=what_you_changed"; exit 1; }
	@cd back && pnpm prisma migrate dev --name $(NAME)

migrate-provider:
	@test -n "$(NAME)" || { echo "usage: make migrate-provider NAME=what_you_changed"; exit 1; }
	@cd provider && pnpm prisma migrate dev --name $(NAME)

docker-secrets: docker-secrets-server docker-secrets-provider

docker-secrets-server:
	@docker/make-secrets.sh server

docker-secrets-provider:
	@docker/make-secrets.sh provider

prod-server:
	@docker compose up -d --build --wait

prod-provider:
	@docker compose -f provider/docker-compose.yml up -d --build --wait

prod-server-down:
	@docker compose down

prod-provider-down:
	@docker compose -f provider/docker-compose.yml down

prod-server-logs:
	@docker compose logs -f --tail=100

prod-provider-logs:
	@docker compose -f provider/docker-compose.yml logs -f --tail=100

genkey:
	@openssl genrsa -out back/provider.pem 2048

.PHONY: run init provider migrate-back migrate-provider genkey docker-secrets docker-secrets-provider prod-server prod-provider prod-server-down prod-provider-down prod-server-logs prod-provider-logs

