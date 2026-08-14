# SitePulse — Production Deployment Guide

Deploy **SitePulse** (backend API + React frontend) to production with
**Docker Compose** behind **Nginx**, with PostgreSQL.

## 1. Architecture

```
Clients (Browser/Mobile/API)
        │  HTTPS
        ▼
   ┌─ Domain / Cloudflare (optional CDN+SSL) ─┐
        │  HTTP
        ▼
  ┌────────────────┐
  │   Nginx        │  static files + /api + /socket.io → backend
  └───────┬────────┘
          │ internal :5000 (NOT published)
          ▼
  ┌──────────────┐    ┌──────────────┐
  │   Backend    │───▶│  PostgreSQL  │   Node / Express / Prisma
  └──────────────┘    └──────────────┘
```

> **Principle:** Nginx is the only public edge. The backend port is exposed
> internally only.

## 2. Prerequisites

- Docker Engine 24+ and Docker Compose v2 (2.20+)
- A domain name with a DNS A record → your server IP
- (Optional) `make`

## 3. Environment Variables

Docker Compose loads secrets from `env_file: .env.production` (project root).

```bash
cp .env.production.example .env.production   # edit; replace all CHG_* placeholders
```

### 3.1 What each variable controls

| Variable | Purpose |
|----------|---------|
| `POSTGRES_USER / _PASSWORD / _DB` | DB credentials at init time |
| `DATABASE_URL` | App → DB connection (use `postgres` service name) |
| `JWT_SECRET` | Sign access tokens — `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Sign refresh tokens |
| `FRONTEND_URL` / `CORS_ORIGIN` | Public frontend URL |
| `COOKIE_SECURE` / `TRUST_PROXY` | Secure cookies behind HTTPS+Nginx → `true` |
| `EMAIL_HOST/PORT/USER/PASS` | SMTP provider (Resend recommended) |
| `OPENAI_API_KEY`, … | AI providers |
| `RAZORPAY_*` / `STRIPE_*` | Payment gateways |

> 🔐 Never commit real secrets. `.env.production` is git-ignored.

## 4. SSL / HTTPS (Let's Encrypt or Cloudflare)

1. Point domain DNS at the server.
2. **Cloudflare** (recommended): proxy domain, "Full (strict)" TLS, set
   `server_name` to your domain in `nginx/nginx.conf`.
3. **certbot** (host): `certbot certonly --standalone -d app.sitepulse.com`,
   then mount `/etc/letsencrypt` into the nginx container and enable the
   commented TLS block in `nginx/nginx.conf`.
4. Set `FRONTEND_URL=https://app.sitepulse.com`,
   `CORS_ORIGIN=https://app.sitepulse.com`,
   `COOKIE_SECURE=true`, `TRUST_PROXY=true`.

## 5. Build & Deploy

```bash
# From repo root:
cp .env.production.example .env.production   # edit; replace all CHG_* placeholders
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose ps
curl http://localhost/health            # nginx liveness
curl http://localhost/api/health        # backend health (proxied)
```

## 6. Frontend

Built **inside** `Dockerfile.nginx` (multi-stage): `npm ci` + `npm run build`
(Vite) → optimized `dist/` served by Nginx with content-hash asset names and
1-year cache headers.

Only `VITE_*` vars are embedded at build time. `VITE_API_URL=/api` (same-origin)
routes calls through Nginx.

## 7. Security Hardening

| Concern | Implementation |
|---------|----------------|
| HTTP security headers | `helmet` (backend) + Nginx `add_header(...)` |
| XSS / clickjacking | CSP, `X-Frame-Options`, `X-Content-Type-Options` |
| Rate limiting | `express-rate-limit` (configurable per-window) |
| Input validation | `express-validator` on write endpoints |
| JWT | short-lived access token + httpOnly refresh cookie |
| Passwords | hashed with `bcrypt` |
| Multi-tenancy | all queries scoped by `companyId`; RBAC + permission middleware |
| File uploads | `multer` + size limits; isolated path |
| Least privilege | backend runs as non-root `nodejs` user |
| Secrets | DB creds never in image; injected via `env_file` |

## 8. Performance & Optimization

- **Backend**: cluster via PM2 (`ecosystem.config.js`); in Docker, scale with
  `docker compose up --scale backend=3` (stateless).
- **Database**: Prisma singleton connection pool.
- **Frontend**: Vite code-splitting, hashed assets, `terser` minify, console
  & debugger stripping, vendor chunk splitting (`vite.config.js`).
- **Nginx**: `gzip`, `keepalive`, 1-year `Cache-Control` on `/assets/`,
  `try_files` SPA fallback, `keepalive` upstream.
- **API**: `compression` middleware, request size limits, ETags.
- **Health checks**: `/health` (nginx) and `/api/health` (backend).

## 9. Production Checklist

1. [ ] Set `POSTGRES_PASSWORD` and matching `DATABASE_URL` password.
2. [ ] Generate strong `JWT_SECRET` & `JWT_REFRESH_SECRET` (`openssl rand -base64 48`).
3. [ ] Configure email provider (Resend/SMTP) credentials.
4. [ ] (Optional) Add AI provider API keys (`OPENAI_API_KEY`, etc.).
5. [ ] (Optional) Add payment gateway keys (Razorpay / Stripe) + configure webhooks.
6. [ ] Point DNS A record at the server; provision SSL (Cloudflare / certbot).
7. [ ] Set `FRONTEND_URL`, `CORS_ORIGIN`, `COOKIE_SECURE=true`, `TRUST_PROXY=true`.
8. [ ] Build & deploy: `docker compose ... up -d --build`.
9. [ ] Verify `/health` and `/api/health`.
10. [ ] Configure monitoring & backups (see §10).

## 10. Monitoring & Logs (recommended next)

- **Logs**: `docker compose logs -f backend` (or ship to a log volume).
- **Metrics**: add Prometheus metrics (e.g. `express-prom-bundle`).
- **Error tracking**: add Sentry (server SDK + `VITE_SENTRY_DSN` client).
- **DB backups**: scheduled `pg_dump` → object storage.
- **Uptime**: external ping to `/health` (UptimeRobot / healthchecks.io).

## 11. Updates & Rollbacks

```bash
# Zero-downtime rebuild of backend
docker compose up -d --build --no-deps backend

# Rollback
docker compose down
git checkout <previous-tag>
docker compose up -d --build

# Scale backend (stateless)
docker compose up -d --scale backend=3
```
