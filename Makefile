init:
	@mkdir -p /tmp/flex-db
	@docker compose up -d --wait
	@cd back && pnpm prisma migrate dev --name init && cd ..
	@mkdir -p ./back/uploads/avatars
	@mkdir -p ./back/uploads/playlists

run: init
	pnpm run dev

migrate:
	@cd back && pnpm prisma migrate dev --name init && cd ..

.PHONY: run


