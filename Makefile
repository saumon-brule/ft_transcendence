init:
	@mkdir -p /tmp/flex-db
	@docker compose up -d
	@cd back && npx prisma migrate dev --name init && cd ..

run: init
	pnpm run dev

.PHONY: run