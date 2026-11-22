*This project has been created as part of the 42 curriculum by lilefebv, ebini, ethebaul, vaamonch.*

# Flex — ft_transcendence

## Description

Flex is a music streaming website where the music is not stored on one central server.
Anyone can run a **provider**: a small server that holds a music catalog (songs, albums, artists, covers, audio files) and chooses who can listen to it.
The Flex server manages the accounts, friends, chat and playlists, and tells the browser which providers a user can use.
A playlist can mix songs from several providers, and the browser plays each song directly from its provider.

### Key features

- Full account system, 42 OAuth, and email verification / account recovery.
- Profiles with avatar, friends and online presence.
- Ephemeral chat between friends.
- Playlists: create, rename, public/private, custom cover, delete, follow the public playlists of other users.
- Self hosted providers with your own catalog, members, permissions and access management.
- Search with filters, sort and infinite scroll.
- Audio player with queue and listening history.
- Public API with a personal API key.
- Interface in four languages (English, French, Spanish, Japanese), with a light and a dark theme.
- Docker deployment (read-only containers, Docker secrets, HTTPS), CI on every pull request.

## Instructions

### Prerequisites

- Docker and Docker Compose, `make`, and `openssl` (used to generate the secrets).
- For local development without Docker images: Node.js >= 26 and [pnpm](https://pnpm.io) 12.
- A [42 API application](https://profile.intra.42.fr/oauth/applications) if you want the 42 login (redirect URI: `https://<FRONT_HOST>[:<FRONT_PORT>]/auth/42/auth-callback`, without the port when it is 443).
- An SMTP account (email verification and password reset).

### Where things are

- **Production** is at the root: `docker-compose.yml` (server) and `docker-compose.provider.yml` (providers), `.env` and `.env.provider-<name>` for the settings, `secrets/server/` and `secrets/provider-<name>/` for the secrets, `docker/` for the Docker helpers and the nginx templates. The Makefile drives all of it.
- **Development** is in the applications and in `scripts/dev/`: `back/.env.example`, `front/.env.example`, `provider/.env.example`, pnpm scripts, seed scripts in the `dev/` folders.

### Run the server (database, migrations, back, front)

```bash
make secrets-server    # creates secrets/server/ and .env (from .env.example)
```

Then fill in `.env` (host and ports of the site, SMTP server, 42 application) and put the SMTP password and the 42 secret in `secrets/server/smtp_pass` and `secrets/server/api42_client_secret`.

```bash
make server            # docker compose up -d --build --wait
```

The site is served by nginx in HTTPS on `FRONT_PORT` (443 by default). `FRONT_HTTP_PORT` (80) redirects to it. The host and both ports are set in `.env`, and the public address of the site (`https://<FRONT_HOST>:<FRONT_PORT>`, used for the 42 login and the emails) is computed from them. The front calls the back through `/api`.
The database is only reachable from the stack, and the migrations are applied by the `migrate` service before the back starts.

Everything sensitive is a [Docker secret](https://docs.docker.com/compose/how-tos/use-secrets/), a file of `secrets/server/` mounted in `/run/secrets` (the `NAME_FILE` variables are resolved by [docker/entrypoint.sh](docker/entrypoint.sh)):

| File | Content |
| --- | --- |
| `postgres_password`, `jwt_secret`, `jwt_refresh_secret` | random, generated |
| `provider.pem` | RSA key signing the provider tokens, generated |
| `tls.crt`, `tls.key` | certificate and key of nginx: self-signed when generated, **replace them with a real certificate** in production (`DOMAIN=example.com make secrets-server` adds a name to the self-signed one) |
| `smtp_pass`, `api42_client_secret` | to fill in by hand |

Existing files are never overwritten. Nothing is seeded in production: the database starts empty and the first account is created from the site.

`GET /api/health` answers 503 when the back cannot reach the database.

### Run a provider (database, migrations, provider, nginx)

Every provider has a name (lowercase letters, digits and dashes), which is required by all the provider commands. Each one has its own secrets, settings, ports and Docker project (`flex-provider-<name>`, so its own database), so several providers can run on the same machine.

```bash
make secrets-provider NAME=music    # creates secrets/provider-music/ and .env.provider-music (from .env.provider.example)
```

Then:
1. Edit `.env.provider-music`: the address of the server (`FLEX_SERVER_URL`), and the host and ports of the provider (`PROVIDER_HOST`, `PROVIDER_PORT`, `PROVIDER_HTTP_PORT`). Use other ports for each provider of the same machine.
2. Create the provider on the app (from the *Providers* page), with the public address `https://<PROVIDER_HOST>:<PROVIDER_PORT>`. It gives the API key, shown once: put it in `secrets/provider-music/flex_api_key`.

```bash
make provider NAME=music            # docker compose up -d --build --wait for this provider
```

The provider is served in HTTPS by its own nginx on `PROVIDER_PORT`; `PROVIDER_HTTP_PORT` redirects to it. `tls.crt` and `tls.key` work like the server's.
`server_ca.crt` is the certificate (or CA) of the server, trusted by the provider when it calls it: the generator copies the server's self-signed certificate from `secrets/server/tls.crt` if it exists.

`FLEX_SERVER_URL` must be reachable from the container and end with `/api` when it targets the Docker front (`https://host.docker.internal:<FRONT_PORT>/api` for a server on the same machine).
The address registered on the server is the one browsers use to reach the provider (`https://…`), not a container name.

`make server-down` / `provider-down NAME=music` stop a stack (the volumes are kept), `server-logs` / `provider-logs NAME=music` follow its logs,
`server-reset` / `provider-reset NAME=music` delete its data (they ask for `CONFIRM=yes`).

### Behind your own reverse proxy

If you already have an nginx (or any reverse proxy) on the machine, run only the containers and plug it in: the bundled nginx/TLS is not started.

```sh
# server: set FRONT_HOST, FRONT_PORT (your public address) and FRONT_UPSTREAM_PORT in .env
make server-standalone        # the front listens in HTTP on 127.0.0.1:FRONT_UPSTREAM_PORT

# provider: set PROVIDER_HOST, PROVIDER_PORT (public) and PROVIDER_UPSTREAM_PORT in .env.provider-<name>
make provider-standalone NAME=<name>   # the provider listens in HTTP on 127.0.0.1:PROVIDER_UPSTREAM_PORT
```

`server-down`, `server-logs`, `provider-down`... work the same. Your proxy must terminate TLS on the public address and forward `Host`, `X-Forwarded-For` and `X-Forwarded-Proto`. Example for the server:

```nginx
server {
    listen 443 ssl;
    server_name flex.example.com;
    # ssl_certificate ...

    client_max_body_size 6m;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;       # websockets (/api/socket.io/)
        proxy_set_header Connection $connection_upgrade;  # map $http_upgrade $connection_upgrade { default upgrade; '' close; }
        proxy_read_timeout 1h;
    }
}
```

For a provider, use the same block with `proxy_pass http://127.0.0.1:4081;`, `client_max_body_size 201m;`, `proxy_request_buffering off;` and `proxy_buffering off;`. If the server uses a certificate from a public CA, the provider's `server_ca.crt` secret can simply be that CA bundle.

### Development

The Makefile only drives the production stacks (Docker). Everything for development goes through pnpm scripts, and the development settings are the `.env.example` files of `back`, `front` and `provider` (production settings are the ones at the root).

```bash
pnpm install          # every package of the workspace
pnpm run dev          # development database (Docker), migrations, test accounts, then back and front with hot reload
pnpm run dev:provider1   # a provider with a mock catalog (optional, in another terminal)
```

Test accounts (development only): `liam@test.com`, `chantal@test.com` and `machin@test.com`, password `abcdefgh`.
The mock catalog of the providers lives in `provider/mock`, the seed scripts are in the `dev/` folders of `back` and `provider`, and the other development tools (database in Docker, YouTube audio download, Discord presence) are in `scripts/` (`pnpm --filter @flex/provider run seed:search` fills a provider with a large search test catalog).
These folders are not part of the production images.

`pnpm run dev:front` starts the front end only. The back and the provider read `shared/src` directly in development (`paths` in their `tsconfig.json`), so `shared` does not need to be built to run them.
`shared/dist` is only needed by production builds (`tsconfig.build.json` ignores these `paths`), the Docker images and the front's type-check: `pnpm run build:shared`.
`pnpm run lint` and `pnpm run check` lint and type-check the whole workspace.
New migration: `pnpm run migrate:back --name what_you_changed` (or `migrate:provider`). `pnpm run reset:back` / `reset:provider` recreate a development database.

### Hardening and logs

Every container drops all Linux capabilities (Postgres keeps the few it needs to start), cannot gain new privileges and has a read-only filesystem: only the volumes and a `/tmp` in memory are writable. Docker logs are rotated (3 files of 10 MB).
CI builds the three images and starts the server stack (`docker-stack` job) on each pull request.

## Resources

- [NestJS](https://docs.nestjs.com), [SolidJS](https://docs.solidjs.com), [Prisma](https://www.prisma.io/docs), [PostgreSQL](https://www.postgresql.org/docs/16/), [ParadeDB](https://docs.paradedb.com)
- [ts-rest](https://ts-rest.com), [Zod](https://zod.dev), [TanStack Query](https://tanstack.com/query/v4), [Socket.IO](https://socket.io/docs/v4/)
- [JWT](https://datatracker.ietf.org/doc/html/rfc7519), [42 API](https://api.intra.42.fr/apidoc)

### Use of AI

We used AI assistants (such as Claude) as a help, not as a replacement: everything was read, tested and committed by a team member.

- **Tasks:** code review and bug hunting, refactoring code, explaining the stack (NestJS, SolidJS, Prisma, ts-rest), repetitive tasks (such as replacing every text of the app with its i18n key or fixing broken CSS) and most of this README.
- **Parts of the project:** no part of the project was written entirely by AI, and no part was kept entirely free of it: it was used as a helper across the whole codebase.

## Team

| Member | Role(s) | Responsibilities |
| --- | --- | --- |
| Erwoan (ethebaul) | Product Owner, Developer | Decides what the product should do and in which order, keeps the backlog, validates finished work. |
| Liam (lilefebv) | Project Manager, Developer | Organizes the meetings and the planning, follows progress and deadlines, helps unblock the others. |
| Emilien (ebini) | Technical Lead, Developer | Chooses the architecture and the technologies, takes care of code quality, reviews the important changes. |
| Vadim (vaamonch) | Developer | Builds and tests features and modules, and documents them. |

## Project management

- **Organization:** one GitHub issue and one branch per task, merged with a pull request that another member reviews.
- **Tools:** GitHub Issues and Pull Requests, GitHub Actions (lint, type-check and Docker build on every pull request).
- **Communication:** a Discord server for everyday discussions, and meetings in person at the campus. Liam ran a weekly check-in meeting (daily during the last days of the project).

## Technical stack

| Part | Technologies |
| --- | --- |
| Front end | [SolidJS](https://www.solidjs.com), TypeScript, Vite, TanStack Query, Sass, lucide icons, socket.io-client |
| Server | [NestJS](https://nestjs.com) 11, Passport / JWT, Socket.IO, Prisma 7, sharp, Nodemailer, Swagger |
| Provider | NestJS, Prisma, music-metadata, multer |
| Shared | `shared` package: [ts-rest](https://ts-rest.com) contracts and [Zod](https://zod.dev) schemas used by the three applications |
| Databases | PostgreSQL 16 (server), [ParadeDB](https://www.paradedb.com) = PostgreSQL with ranked full-text search (providers) |
| Infrastructure | Docker Compose, nginx (HTTPS), Docker secrets, GitHub Actions, pnpm workspace |

**Why these choices.** The three applications talk to each other, so we put the routes in one shared package (ts-rest + Zod). It types the clients, validates the servers and generates the API documentation, so they cannot get out of sync.
NestJS gives us modules, guards and interceptors, which helps with an API that has several kinds of authentication (user token, provider API key, provider token). SolidJS is light and fast to update, which suits a player, presence dots and a chat that change all the time.
We use a relational database for users, friendships, playlists and memberships. ParadeDB (PostgreSQL with full-text search) gives the providers a ranked search that tolerates typos.

## Database schema

### Server database (PostgreSQL)

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Token : has
    User ||--o{ FriendRequest : "sends / receives"
    User ||--o{ Playlist : owns
    User ||--o{ Provider : owns
    User ||--o{ ProviderUser : "member of"
    User ||--o{ ProviderAccessRequest : asks
    Provider ||--o{ ProviderUser : has
    Provider ||--o{ ProviderAccessRequest : receives
    Playlist ||--o{ PlaylistMusic : contains
    Provider ||--o{ PlaylistMusic : serves
    Playlist ||--o{ UserPlaylist : "followed by"

    User {
        int id PK
        string uuid UK
        string email UK
        string password "null for 42 only accounts"
        string username
        bool emailValidated
        int intraId UK "42 account"
        string language
    }
    FriendRequest {
        string userUUID FK
        string friendUUID FK
        enum status "PENDING ACCEPTED DENIED"
    }
    Session {
        string userUUID FK
        string jti
        datetime expiresAt
    }
    Token {
        string token UK
        enum purpose "EMAIL_VERIFICATION PASSWORD_RESET ..."
        datetime expiresAt
    }
    Provider {
        string uuid UK
        string name UK
        string address
        string ownerUUID FK
        string hashedKey UK
    }
    ProviderUser {
        string providerUUID FK
        string userUUID FK
    }
    ProviderAccessRequest {
        string providerUUID FK
        string userUUID FK
        enum status "PENDING APPROVED REJECTED"
    }
    Playlist {
        string uuid UK
        string name
        string ownerUUID FK
        bool private
    }
    UserPlaylist {
        string userUUID FK
        string playlistUUID FK
    }
    PlaylistMusic {
        string playlistUUID FK
        string musicUUID "song of a provider"
        string providerUUID FK
    }
```

A song only exists in the catalog of its provider: the server only stores a reference (`musicUUID`, `providerUUID`). `AppConfig` (key / value) holds the 42 application credentials.

### Provider database (ParadeDB)

```mermaid
erDiagram
    Provider ||--|| Member : "owned by"
    Provider |o--o| Role : "default role"
    Member ||--o{ MemberRole : has
    Role ||--o{ MemberRole : "granted to"
    Role ||--o{ RolePermission : has
    Member ||--o{ AccessRequest : decides
    Album ||--o{ Music : contains
    Music ||--o{ MusicArtist : has
    Artist ||--o{ MusicArtist : has
    Album ||--o{ AlbumArtist : has
    Artist ||--o{ AlbumArtist : has

    Provider {
        int id PK "always 1"
        string uuid UK
        enum visibility "PUBLIC PRIVATE"
        string ownerUuid FK
        string defaultRoleUuid FK
    }
    Member {
        string uuid UK "uuid of the server user"
        datetime revokedAt
    }
    AccessRequest {
        string uuid UK
        string userUuid
        enum status "PENDING APPROVED REJECTED"
        string decidedByUuid FK
    }
    Role {
        string uuid UK
        string name UK
    }
    RolePermission {
        enum permission "MANAGE_CATALOG MANAGE_MEMBERS ADMIN"
    }
    Music {
        string uuid UK
        string name
        int duration
        bool hasAudio
        bool hasCover
        string albumUuid FK
        datetime publishedAt
    }
    Artist {
        string uuid UK
        string name
        string biography
    }
    Album {
        string uuid UK
        string name
        datetime publishedAt
    }
```

## Features

| Feature | Description | Who |
| --- | --- | --- |
| Authentication (back) | Email and password with email verification and password reset, 42 OAuth (login, link and unlink an account), short-lived access token plus a refresh cookie. | Liam |
| Authentication (front) | Every authentication screen (login, register, email verification, password reset, ...), the route guards, and loading the user profile and language for the whole app. | Emilien |
| Providers (back) | Create, edit and delete a provider, regenerate its API key, access requests that are accepted automatically (public provider) or by a manager. | Erwoan |
| Provider (provider) | The provider application: setup, the full provider protocol, catalog management. | Erwoan |
| Profile and Providers (front) | Display user profiles, create and remove a provider, regenerate its API key. | Liam |
| Settings (front) | Change the username, email and password, link an intra account, upload an avatar, choose the language and the light or dark theme. | Emilien |
| Playlist (back) | Create, update, delete, add music, remove music, display on profile, manage private/public. | Vadim |
| Friends and presence (back) | Send, accept, decline and remove friend requests, see who is online in real time. | Vadim |
| Chat (back) | Ephemeral chat between online friends. Friend requests and other friend events reach the other user instantly through WebSockets. | Vadim |
| Friends and chat (front) | Display friends and requests, open a chat to talk between users. | Liam |
| Music player/footer (front) | Play a song, control the volume, keep the listening history, display the queue. | Emilien |
| Playlists (front) | Create, rename, make public or private, set a cover, delete; add and remove songs from any provider; follow and unfollow the public playlists of other users. | Erwoan |
| Sidebar, header | Display the sidebar content, the header search and menu. | Liam |
| Provider management (front) | Manage members and roles (`MANAGE_CATALOG`, `MANAGE_MEMBERS`, `ADMIN`), create, edit and delete songs, albums and artists with audio and cover upload. | Liam, Emilien |
| Search (back) | Search users and playlists. | Vadim |
| Search (provider) | Search songs, albums and artists across the catalogs of all your providers. Results can be filtered (song, album, artist, dates) and sorted (by column or by provider). Ranked with BM25. | Erwoan |
| Search (front) | Search page, results from every provider, filters, sorting. | Liam, Erwoan |
| Provider / edit provider | View the songs, albums and artists of a provider; edit its catalog, members and permissions. | Liam, Emilien |
| Public API | Personal API key, hourly quota, 9 endpoints on the profile and the playlists, Swagger documentation at `/api/swagger`. | Vadim, Liam |
| Deployment | Docker images, hardened containers (no capabilities, read-only filesystem), Docker secrets, HTTPS, health checks and CI. | Erwoan |
| Other front parts | Shared components, guards, layout. | Emilien, Liam |
| Other back parts | Remaining server routes. | Vadim |
| Other provider parts | Remaining provider routes. | Erwoan |


## Modules

Major = 2 points, Minor = 1 point.

| Module | Type | Points | Justification / implementation | Who |
| --- | --- | --- | --- | --- |
| Framework for frontend and backend | Major | 2 | **Why:** obvious, nobody wants to write a whole web app by hand, a framework gives structure to three applications. **How:** SolidJS for the front, NestJS for the server and the provider. | Whole team |
| Users interacting with each other | Major | 2 | **Why:** social is at the center of the app: you join providers through other people, share playlists and follow your friends public ones, so you need to see who is online and talk to them. **How:** chat, profile pages, friends system with presence. | Liam, Vadim |
| Standard user management and authentication | Major | 2 | **Why:** obvious, every playlist, provider membership and friend is tied to an account. **How:** profile update, avatar with default, friends and online status, profile page. | Emilien, Liam, Vadim |
| Advanced permissions system | Major | 2 | **Why:** a provider is shared by several people (an artist, a label, a group of friends), so not everybody should be able to edit the catalog or manage the members. **How:** roles and permissions in each provider. *View* the members of a provider, *edit* them (assign and remove roles), *delete* them (revoke their access); create, edit and delete roles (`MANAGE_CATALOG`, `MANAGE_MEMBERS`, `ADMIN`, plus a default role for new members). The pages and actions a user gets depend on their permissions (for example, the edit page and the catalog actions are only shown to members who can manage the catalog). | Liam, Emilien, Erwoan |
| Public API | Major | 2 | **Why:** lets users and scripts access their profile and playlists outside of the site (bots, imports, other clients). **How:** personal API key (stored hashed, sent as a Bearer token), rate limiting and an hourly quota, Swagger documentation, 9 endpoints (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). | Vadim, Liam |
| Custom module: decentralized providers | Major | 2 | **Why:** the core idea of the project, see below. | Whole team |
| ORM for the database | Minor | 1 | **Why:** obvious, we needed a database anyway (two of them, server and provider), and an ORM with typed queries and migrations is much more practical than raw SQL. **How:** Prisma on both databases, with migrations. | Erwoan, Liam, Vadim |
| Custom design system | Minor | 1 | **Why:** the same components are used on every page, so building them once keeps the app consistent and saves time. **How:** more than ten reusable components (Button, TextInput, Select, Checkbox, Toggle, Form, pop-ups, Toaster, Menu, Tabs, SortBar, cards…), a color palette with light and dark themes, fonts and icons. | Emilien, Liam |
| Advanced search | Minor | 1 | **Why:** the catalog is spread over several providers and can be big, so a simple text search is not enough to find a song. **How:** catalog search with filters, sorting (by column or by provider) and results loaded page by page while scrolling. | Erwoan |
| File upload and management | Minor | 1 | **Why:** obvious for a music app: providers need to upload their audio and covers, and users their avatar and playlist covers. **How:** avatars, playlist covers, audio and cover files on providers: type and size checks on the front and the back, previews, progress bars, deletion, and access to the files with provider media tokens. | Erwoan, Liam, Emilien |
| OAuth 2.0 remote authentication | Minor | 1 | **Why:** every 42 student already has an account, so logging in with it is faster than creating a new one. **How:** 42 login, and linking or unlinking a 42 account to an existing account. | Liam, Emilien |
| Multiple languages | Minor | 1 | **Why:** music is shared between people who do not all speak the same language. **How:** translation system with a language picker. All the texts are translated in English, French, Spanish and Japanese. | Emilien |
| Support for additional browsers | Minor | 1 | **Why:** users do not all use the same browser. **How:** Firefox and Chromium-based browsers, see below. | Whole team |

**Total: 19 points** (12 from the six major modules, 7 from the seven minor modules).

### Custom major module: decentralized providers

- **Why:** a streaming service usually owns its whole catalog. Here the owners of the catalogs keep their content and choose who can listen to it. It works for independent artists, labels, or friends who want to share a collection.
- **How it works:** a provider is a server of its own, with its own database, roles, media storage and migrations, and you can run several of them on one machine. The main server only knows that a provider exists (its UUID, its name, its API key) and who asked to join it. The front talks to each provider directly to get the catalog and stream the audio.

#### Trusting a user without being the server (RS256)

A provider has no user accounts and no passwords: it cannot check who a user is by itself. It still has to be sure that a request really comes from a user logged in on the server, without asking the server on every request.

- The server has an RSA key pair (at least 2048 bits, a Docker secret in production). It keeps the private key and gives the public key on `GET /providers/public-key`.
- When the front needs a provider, it asks the server for a token for that provider. The server signs a JWT with **RS256**: `sub` is the user UUID, `aud` is the provider UUID, `scope` is `access`, and it expires after one hour.
- The provider gets the server's public key (cached for 5 minutes) and checks the signature, the expiry, the audience (it must be its own UUID) and the scope. If everything is valid, it knows the user without ever seeing their password or session.
- **Why asymmetric and not a shared secret (HS256):** with a shared secret, every provider could also *sign* tokens, so one malicious provider could create tokens for any user and use them on other providers. With RS256, providers can only *check* tokens, and only the server can create them.
- **Why one audience per provider:** a token for provider A is refused by provider B. A provider that receives a token cannot reuse it on another provider in the name of the user.
- The token only proves *who* the user is. *What* they can do is decided by the provider: it checks in its own database that the user is a member and which roles they have.

#### Challenges

- **The server does not know the music.** A playlist on the server only stores pairs of UUIDs (`providerUUID`, `musicUUID`). The server cannot read these UUIDs: it does not know the title, the artist or the file behind them. The front takes these UUIDs, asks each provider for the details with that provider's token, and builds the playlist on its side. The good side is that the server knows nothing about the music going through it: the catalogs, the files and what they contain stay on the providers, and the owners stay in full control of their content. The cost is that the front has to handle songs it cannot show: a provider that is offline, a song that was deleted, or a provider the user no longer has access to.
- **Several providers at the same time.** The front keeps one access token per provider, gets a new one when it expires, and mixes songs from several providers in the same playlist, the same queue and the same search results.
- **Media files.** An `<audio>` or `<img>` tag cannot send an `Authorization` header. The provider gives a separate media token (signed by the provider itself, only valid on that provider) that goes in the URL of the files. Each time it is used, the provider checks that the user is still a member, so a removed member loses access to the files quickly.
- **Joining a provider takes two steps.** The user asks the server, then the provider checks that request with the server (with its API key) before creating the member on its side. When a member is removed on the provider, the provider tells the server so both sides stay in sync.
- **No shared database.** The server and the providers only talk through HTTP contracts (ts-rest and Zod, shared in `shared/`), so each side checks everything it receives from the other.

- **Why it is a major module:** most of the project is built around it (playlists, access requests, roles, catalog, search, media). It is a second full back end (catalog, media, permissions), plus the trust and token system between the applications, plus the front end that works with several providers at once.

### Browser support

The site is used and checked on Firefox and on Chromium-based browsers (Chromium, Chrome, Edge, ...). Known difference: the date picker of the search filters looks different in each browser (the filters have a fixed height to keep the same layout).

## Individual contributions


### Erwoan (ethebaul)
- Features: providers on the server (creation, API key, access requests), the provider application (access protocol, catalog management, search with BM25 and filters), playlists on the front, search page, Docker deployment and CI.
- Modules: framework, advanced permissions, custom providers, ORM, advanced search, file upload, additional browsers.
- Challenges and solutions: learning a new web stack (NestJS and SolidJS) and learning how to organize the shared ts-rest contracts and the Prisma schemas. Overcome by learning while building the providers and the search, with one shared contract per route so the front and the back stay in sync.

### Liam (lilefebv)
- Features: authentication on the server (email, 42 OAuth, tokens), profile and providers pages, friends and chat on the front, sidebar and header, provider management (members, roles, catalog), search page, public API.
- Modules: framework, users interacting, standard user management, advanced permissions, public API, custom providers, ORM, design system, file upload, OAuth, additional browsers.
- Challenges and solutions: discovering NestJS and SolidJS. Overcome by learning them while building the authentication and the first SolidJS components.

### Emilien (ebini)
- Features: authentication on the front (login, register, auth guard), settings (profile, 42 account link, avatar, language, theme), music player and footer, provider management (catalog), design system.
- Modules: framework, standard user management, advanced permissions, custom providers, design system, file upload, OAuth, multiple languages, additional browsers.
- Challenges and solutions: thinking through the architecture of the whole project (server, providers, shared contracts) and the technical choices before building on them.

### Vadim (vaamonch)
- Features: playlists on the server, friends and presence, chat and real-time events, user and playlist search on the server, public API.
- Modules: framework, users interacting, standard user management, public API, custom providers, ORM, additional browsers.
- Challenges and solutions: learning NestJS and Prisma. Overcome by learning them while building the friends system.

## Known limitations

- Chat messages are ephemeral on purpose: they are not stored and they are not delivered to offline users.
- The app is not fully peer-to-peer: a central server still manages the accounts.
- Search shows at most the first 100 results of each provider (the infinite scroll stops there).

## Documentation

- Public API: create a key in *Settings → API*, then send it as `Authorization: Bearer <key>`. The documentation is at `<backurl>/api/swagger` (or `<fronturl>/api/api/swagger`).
- Design notes: [docs/modules.md](docs/modules.md), [docs/roles.md](docs/roles.md), [scripts/discord/README.md](scripts/discord/README.md).
