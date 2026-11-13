# ft_transcendence

## Setup

We use pnpm to handle node packages

run `pnpm install` to install every modules. Then run `pnpm run dev:front` in the root of the project or `pnpm run dev` in the `/front` to start the front end only.


## Docker

The server and the provider are two independent stacks, each started with `docker compose`.

### Server (database, migrations, back, front)

```bash
cp .env.example .env        # fill in the public URL, the SMTP server and the 42 application
make secrets         # creates secrets/ (see below)
make server           # docker compose up -d --build --wait
```

The site is served by nginx in HTTPS on `FRONT_PORT` (443 by default). `FRONT_HTTP_PORT` (80) redirects to `BASE_FRONT_URL`. The front calls the back through `/api`.
The database is only reachable from the stack, and the migrations are applied by the `migrate` service before the back starts.

Everything sensitive is a [Docker secret](https://docs.docker.com/compose/how-tos/use-secrets/), a file of `secrets/`
mounted in `/run/secrets` (the `NAME_FILE` variables are resolved by [docker/entrypoint.sh](docker/entrypoint.sh)):

| File | Content |
| --- | --- |
| `postgres_password`, `jwt_secret`, `jwt_refresh_secret` | random, generated |
| `provider.pem` | RSA key signing the provider tokens, generated |
| `tls.crt`, `tls.key` | certificate and key of nginx: self-signed when generated, **replace them with a real certificate** in production (`DOMAIN=example.com make secrets` adds a name to the self-signed one) |
| `smtp_pass`, `api42_client_secret` | to fill in by hand |

Existing files are never overwritten. Test accounts are seeded in `dev` only.

`GET /api/health` answers 503 when the back cannot reach the database.

### Provider (database, migrations, provider, nginx)

Create the provider on the server first: it gives the API key.

```bash
cp provider/.env.example provider/.env        # FLEX_SERVER_URL, POSTGRES_*
make secrets-provider   # then put the API key in provider/secrets/flex_api_key
make provider         # docker compose -f provider/docker-compose.yml up -d --build --wait
```

The provider is served in HTTPS by its own nginx on `PROVIDER_PORT` (443 by default, to change if the server runs on the same machine); `PROVIDER_HTTP_PORT` (80) redirects to `PROVIDER_URL`, its public address; `tls.crt` and `tls.key` work like the server's.
`secrets/server_ca.crt` is the certificate (or CA) of the server, trusted by the provider when it calls it: the generator
copies the server's self-signed certificate if `secrets/tls.crt` exists.

`FLEX_SERVER_URL` must be reachable from the container and end with `/api` when it targets the Docker front
(`https://host.docker.internal:<FRONT_PORT>/api` for a server on the same machine).
The `provider` URL registered on the server is the one browsers use to reach it (`https://…`), not a container name.

`make server-down` / `provider-down` stop a stack (the volumes are kept), `server-logs` / `provider-logs` follow its logs.

### Several providers on one machine

`make provider NAME=1` runs a second provider next to the default one: its own Docker project (`flex-provider-1`, so its own
database volume), its settings in `provider/.env.1` (copy `provider/.env.example` and change `PROVIDER_PORT`,
`PROVIDER_HTTP_PORT` and `PROVIDER_URL`) and its secrets in `provider/secrets.1` (`make secrets-provider NAME=1`, then put the
API key of this provider in `flex_api_key`). `NAME` works the same way with `provider-down`, `provider-logs`, `provider-seed`
and `provider-reset`. Without `NAME`, they act on the default provider.

### Hardening and logs

Every container drops all Linux capabilities (Postgres keeps the few it needs to start), cannot gain new privileges and has a
read-only filesystem: only the volumes and a `/tmp` in memory are writable. Docker logs are rotated (3 files of 10 MB).
CI builds the three images and starts the server stack (`docker-stack` job) on each pull request.

### Development

`make run` starts a database in Docker (`docker-compose.dev.yml`) and the back and the front with hot reload (`make provider` for the provider).
The back and the provider read `shared/src` directly in development (`paths` in their `tsconfig.json`), so `shared` does not need to be built to run them.
`shared/dist` is only needed by production builds (`tsconfig.build.json` ignores these `paths`), the Docker images and the front's type-check: `pnpm run build:shared`.
New migration: `make migrate-back NAME=what_you_changed` (or `migrate-provider`).
