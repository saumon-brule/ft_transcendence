init:
	@mkdir -p /tmp/flex-db
	@docker compose up -d --wait
	@cd back && pnpm prisma migrate dev --name init && cd ..

run: init
	pnpm run dev

migrate:
	@cd back && pnpm prisma migrate dev --name init && cd ..

.PHONY: run


