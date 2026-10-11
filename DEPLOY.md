# Deploy tourism-platform

| Service | Published port | Domain |
| --- | --- | --- |
| Backend | 14927 | https://api.toolvqd.io.vn |
| Frontend public | 14928 | https://dev.toolvqd.io.vn |
| Frontend admin | 14929 | https://fb.toolvqd.io.vn |

## Environment

- `backend/.env`: existing database and JWT settings are retained. Compose sets `PORT=14927`, `NODE_ENV=production` and disables demo payment. The database is external; this Compose does not create or initialize MySQL. If MySQL runs on the Docker host, do not use `localhost` as `DB_HOST` inside the container; use an address reachable from Docker (Docker Desktop supports `host.docker.internal`).
- `frontend/.env` and `frontend/.env.production`: API is `https://api.toolvqd.io.vn/api`; demo payment is disabled.
- `frontend-manh-admin/.env` and `frontend-manh-admin/.env.production`: API is `https://api.toolvqd.io.vn/api`.
- `.env.production` for both frontends is committed and copied into the build stage. It contains public configuration only. Vite reads these values during build, so rebuild the frontend images after changing them. Do not put database passwords or JWT secrets in frontend env files.
- On another server, transfer `backend/.env` securely, or copy `backend/.env.example` to `backend/.env` and fill in real database/JWT settings. Local `.env` files are ignored by Git and excluded from images.

## Run with automatic HTTPS

Install Docker Engine with Docker Compose v2 and use Linux containers. Run commands from the repository root.

1. Point the DNS A records for `api.toolvqd.io.vn`, `dev.toolvqd.io.vn`, and `fb.toolvqd.io.vn` to the server's public IP. If AAAA records exist, ensure they also point to this server.
2. Allow inbound TCP ports 80 and 443; UDP 443 is optional for HTTP/3. These ports must be available for Caddy. The three app ports can be restricted by the server firewall when using the proxy.
3. Verify that `backend/.env` connects to the existing database and that its schema is initialized.
4. Build and start:

```sh
docker compose -f docker-compose.yml -f docker-compose.proxy.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.proxy.yml ps
docker compose -f docker-compose.yml -f docker-compose.proxy.yml logs --tail=100
```

`deploy/Caddyfile` routes the three domains to their respective services. Caddy obtains and renews TLS certificates once DNS and external connectivity are ready. Certificates and backend review uploads persist in named volumes.

## Run behind an existing reverse proxy

If the server already runs Nginx, Caddy, or a hosting panel on 80/443, start only the three apps:

```sh
docker compose up -d --build
```

Configure the existing proxy with HTTPS certificates and these upstreams:

| Host | HTTP upstream on the same server |
| --- | --- |
| api.toolvqd.io.vn | http://127.0.0.1:14927 |
| dev.toolvqd.io.vn | http://127.0.0.1:14928 |
| fb.toolvqd.io.vn | http://127.0.0.1:14929 |

For a single trusted proxy hop, change `TRUST_PROXY` from `"0"` to `"1"` in the backend's Compose environment, then recreate the service. Restrict direct access to port 14927 to keep forwarded IP headers trusted. The bundled proxy override already sets this value.

Both frontend Nginx configs support Vue Router history routes, including page refreshes on nested URLs.

## Check and update

```sh
docker compose config --quiet
docker compose -f docker-compose.yml -f docker-compose.proxy.yml config --quiet
curl https://api.toolvqd.io.vn/
curl -I https://dev.toolvqd.io.vn/
curl -I https://fb.toolvqd.io.vn/
```

If database migrations are required for an existing installation, review the migration files and back up the database before running:

```sh
docker compose run --rm backend npm run migrate
docker compose run --rm backend npm run migrate:departures
```

For updates, run the same `up -d --build` command used at deployment. To stop the full HTTPS stack:

```sh
docker compose -f docker-compose.yml -f docker-compose.proxy.yml down
```

Avoid `down -v` unless you intend to delete persisted uploads and TLS data.

References: [Vite env and modes](https://vite.dev/guide/env-and-mode), [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/), [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https).
