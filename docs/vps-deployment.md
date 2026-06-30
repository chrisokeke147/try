# Deploying TRY to the InterServer $3 KVM VPS

This guide covers transferring the backend code to the VPS and running it via
Docker Compose. It assumes Ubuntu 22.04, terminal-only access, and that you
already have the VPS's IP address and SSH credentials from InterServer.

All commands below are run from **your local machine** unless marked `[VPS]`.

## 1. One-time VPS setup

SSH into the VPS:

```bash
ssh root@<VPS_IP>
```

`[VPS]` Install Docker + Docker Compose plugin:

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin git
```

`[VPS]` Create a non-root deploy user (recommended over running everything as root):

```bash
adduser deploy
usermod -aG docker deploy
```

`[VPS]` Create the app directory:

```bash
mkdir -p /opt/try && chown deploy:deploy /opt/try
```

Log out and back in as `deploy` for the rest of the steps:

```bash
ssh deploy@<VPS_IP>
```

## 2. Transfer files to the VPS

You have two options. **Git pull (recommended)** keeps the VPS in sync with
your repo history and makes redeploys a one-liner. **rsync/scp** is the
fallback if you don't want the VPS to hold git credentials.

### Option A — Git (recommended)

`[VPS]` Clone the repo (use a deploy token / SSH key with read-only access if private):

```bash
cd /opt/try
git clone https://github.com/<your-org>/try-platform.git .
```

To redeploy after pushing new commits, `[VPS]`:

```bash
cd /opt/try && git pull
```

### Option B — rsync (no git on the VPS)

Run from **your local machine**, from the repo root:

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  ./backend ./infra deploy@<VPS_IP>:/opt/try/
```

`-avz` = archive mode, verbose, compressed transfer — safe for repeat syncs
since it only sends changed files.

### Option C — scp (single file, e.g. just the `.env`)

```bash
scp backend/.env deploy@<VPS_IP>:/opt/try/backend/.env
```

Use this whenever you only need to push a secrets/config change without a
full redeploy.

## 3. Configure environment variables

`[VPS]` Copy the example env file and fill in real values (Monnify live keys,
Google Maps key, a strong `POSTGRES_PASSWORD`):

```bash
cd /opt/try/backend
cp .env.example .env
nano .env
```

Set `NODE_ENV=production` and `MONNIFY_BASE_URL=https://api.monnify.com` once
you're off the Monnify sandbox.

## 4. Bring up the stack

`[VPS]`:

```bash
cd /opt/try/infra/docker
docker compose up -d --build
```

Check everything is healthy:

```bash
docker compose ps
docker compose logs -f api
```

### Run database migrations

`synchronize` is always disabled — schema changes go through migrations, not
auto-sync. On first deploy (fresh database) or after any entity change:

```bash
docker compose exec api npx typeorm migration:run -d dist/data-source.js
```

(The container's runtime image omits devDependencies like `ts-node`, so this
uses the plain `typeorm` CLI against the compiled `dist/data-source.js` —
`nest build` compiles `data-source.ts` along with everything else.)

To generate new migrations, do it locally against a real Postgres (e.g. via
an SSH tunnel to the VPS's Postgres) before deploying — see
`backend/src/migrations/` for existing ones and `npm run migration:generate`.

## 5. Point your domain at the VPS

In your `tryride.ng` DNS settings (wherever the domain is registered/managed),
add an A record:

```
api.tryride.ng   ->  <VPS_IP>
admin.tryride.ng ->  <VPS_IP>
```

## 6. Enable HTTPS (Let's Encrypt)

`[VPS]`, once DNS has propagated:

```bash
docker run -it --rm \
  -v /opt/try/infra/docker/certbot_conf:/etc/letsencrypt \
  -v /opt/try/infra/docker/certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d api.tryride.ng -d admin.tryride.ng
```

Then update `infra/docker/nginx.conf` to add the `listen 443 ssl;` block
pointing at the issued cert (`/etc/letsencrypt/live/api.tryride.ng/fullchain.pem`
and `privkey.pem`), and restart nginx:

```bash
docker compose restart nginx
```

Add a cron job for auto-renewal `[VPS]`:

```bash
crontab -e
# add:
0 3 * * * docker run --rm -v /opt/try/infra/docker/certbot_conf:/etc/letsencrypt -v /opt/try/infra/docker/certbot_www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot && docker compose -f /opt/try/infra/docker/docker-compose.yml restart nginx
```

## 7. Database backups

`[VPS]` Add a nightly `pg_dump` cron job (adjust the destination to wherever
you keep off-VPS backups — e.g. an object storage bucket mounted via `rclone`,
or simply `scp` to your local machine):

```bash
crontab -e
# add:
0 2 * * * docker exec $(docker compose -f /opt/try/infra/docker/docker-compose.yml ps -q postgres) pg_dump -U try try | gzip > /opt/try/backups/try-$(date +%F).sql.gz
```

`[VPS]`: create the backups folder first — `mkdir -p /opt/try/backups`.

## 8. Redeploying after a backend change

Git workflow `[VPS]`:

```bash
cd /opt/try && git pull
cd infra/docker
docker compose up -d --build api
```

This rebuilds only the `api` container and restarts it without touching
Postgres/Redis data volumes.

## 9. Admin dashboard and mobile app builds

The admin dashboard (Vite/React) and the two Expo apps are **not** deployed to
the VPS the same way — they're separate artifacts:

- **Admin dashboard**: build a static bundle locally (`cd admin-dashboard && npm run build`),
  then `rsync` the `dist/` folder to the VPS and serve it via a second nginx
  `server {}` block (or a static-hosting service) — point `admin.tryride.ng` at it.
- **Rider/Driver apps**: built and submitted to the Play Store / App Store via
  Expo's EAS Build (`npx eas build --platform all`), not deployed to the VPS at all.
  The VPS only needs to run the `api`, `postgres`, `redis`, and `nginx` containers.
