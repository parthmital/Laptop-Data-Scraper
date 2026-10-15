# Deployment and operations

How to set up, deploy, configure, monitor, back up, secure, maintain and troubleshoot the proposed service. Part of
the [proposal](../PROPOSAL.md).

Each section is marked:

- **Exists**: in the repository and checked.
- **Proposed**: a design or template for Phase 1. Templates were written for Ubuntu 24.04 with systemd and Caddy and
  have **not** been run on a server; check them against the installed versions.

## Contents

- [Topology](#topology)
- [Running the prototype today](#running-the-prototype-today)
- [Server setup](#server-setup)
- [Cloudflare](#cloudflare)
- [Pipeline jobs](#pipeline-jobs)
- [Publishing a new catalogue](#publishing-a-new-catalogue)
- [Environment variables](#environment-variables)
- [Backups and restore](#backups-and-restore)
- [Logging](#logging)
- [Monitoring and alerting](#monitoring-and-alerting)
- [Failure handling and recovery](#failure-handling-and-recovery)
- [Security](#security)
- [Maintenance calendar](#maintenance-calendar)
- [Capacity check on a new server](#capacity-check-on-a-new-server)
- [Troubleshooting](#troubleshooting)

## Topology

**Proposed.**

```text
Visitors -> Cloudflare (cache, TLS, DDoS protection)
         -> Caddy on the server (TLS to Cloudflare, reverse proxy)
         -> next start on 127.0.0.1:3000 (reads /srv/laptop-ledger/data/catalogue.sqlite, read-only)

systemd timers -> pipeline jobs (short-lived Python processes)
               -> /srv/laptop-ledger/data/work.sqlite  (only writer)
               -> publish: VACUUM INTO + rename -> catalogue.sqlite
               -> pings to Healthchecks.io; alerts to Discord

Litestream (always on) -> work.sqlite changes -> Cloudflare R2
```

Directory layout:

```text
/srv/laptop-ledger/
|-- app/            git clone of this repository
|-- data/
|   |-- work.sqlite        pipeline database (Litestream replicates it)
|   |-- catalogue.sqlite   published copy the web app reads
|   `-- published/         last 7 published copies, for rollback
|-- raw/<site>/     gzipped raw pages, pruned after 30 days
`-- logs/           pipeline log files
/etc/laptop-ledger/  environment files, readable by root and the service user only
```

## Running the prototype today

**Exists.** Two independent parts, documented in the README:

- Pipeline: run `laptop-price-pipeline.ipynb` on Kaggle with GPU T4 x2 and Internet on, then copy
  `db/laptops.sqlite` from the run's output into `outputs/db/` ([README: Quick start (Kaggle)](../README.md#quick-start-kaggle)).
- Web app: `npm run dev` from the repository root, or `npm run build` and `npm start` for a production build
  ([README: Web app](../README.md#web-app)).

## Server setup

**Proposed.** About 1 GB of free RAM is enough for the web app and jobs (the web app measured about 170 MB with
today's catalogue and about 420 MB with 3,150 laptops).

1. Install Node.js 24 (the version in `.nvmrc`; 22.13 is the minimum), Python 3.11 or newer, Caddy, the `sqlite3`
   command-line tool and Litestream.
2. Create a service user and directories:

   ```bash
   sudo useradd --system --home /srv/laptop-ledger --shell /usr/sbin/nologin ledger
   sudo mkdir -p /srv/laptop-ledger/{data/published,raw,logs} /etc/laptop-ledger
   sudo git clone https://github.com/<owner>/<repo>.git /srv/laptop-ledger/app
   sudo chown -R ledger:ledger /srv/laptop-ledger
   sudo chmod 750 /etc/laptop-ledger
   ```

3. Build the web app as the service user:

   ```bash
   cd /srv/laptop-ledger/app
   sudo -u ledger npm ci
   sudo -u ledger npm run build
   ```

   `npm run build` must print the route table with `/` and `/laptops/[slug]` as dynamic routes.

4. Create `/etc/laptop-ledger/web.env`:

   ```ini
   LAPTOP_DB_PATH=/srv/laptop-ledger/data/catalogue.sqlite
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

5. Create `/etc/systemd/system/laptop-ledger-web.service`:

   ```ini
   [Unit]
   Description=Laptop Ledger web app
   After=network-online.target

   [Service]
   User=ledger
   WorkingDirectory=/srv/laptop-ledger/app/web
   EnvironmentFile=/etc/laptop-ledger/web.env
   ExecStart=/usr/bin/node ../node_modules/next/dist/bin/next start -p 3000 -H 127.0.0.1
   Restart=on-failure
   RestartSec=5
   NoNewPrivileges=true
   ProtectSystem=strict
   ProtectHome=true
   PrivateTmp=true
   ReadWritePaths=/srv/laptop-ledger/app/web/.next

   [Install]
   WantedBy=multi-user.target
   ```

   Then `sudo systemctl daemon-reload && sudo systemctl enable --now laptop-ledger-web` and check
   `curl -sI http://127.0.0.1:3000/` returns `HTTP/1.1 200 OK`.

6. Add a Caddy site (merge with the existing Caddyfile):

   ```caddyfile
   laptops.pickpcparts.in {
       encode zstd gzip
       reverse_proxy 127.0.0.1:3000
   }
   ```

   To scale out later, start a second instance on port 3001 and list both upstreams in `reverse_proxy`.

7. Updating the app: `git pull`, `npm ci`, `npm run build`, `sudo systemctl restart laptop-ledger-web`. Run
   `npm run check` first on a development machine; CI runs the same command on every push.

## Cloudflare

**Proposed.** PickPCParts already serves through Cloudflare (observed 2026-10-15).

- DNS record for `laptops.pickpcparts.in` proxied (orange cloud); SSL/TLS mode Full (strict).
- **HTML caching.** Verified on 2026-10-15: the production build sends `Cache-Control: private, no-cache, no-store,
max-age=0, must-revalidate` on `/` and laptop pages, so Cloudflare does not cache them. Add a Cache Rule for the
  laptop host that marks requests eligible for cache with an edge TTL of 300 seconds that ignores the origin header,
  and **bypasses** the cache when the request has an `RSC` header or an `_rsc` query parameter (Next.js client
  navigation requests share page URLs but return a different payload; the response's `Vary` lists these headers,
  which a CDN may not honour). After enabling, load a page, click to another page and back, and confirm no raw
  payload text appears. Confirm Cache Rules are available on the account's plan in the dashboard.
- Static files under `/_next/static/` are content-hashed and safe to cache for a long time.
- Cloudflare's free analytics give request counts and cache hit rate.

## Pipeline jobs

**Proposed.** The pipeline is a Kaggle notebook today; Roadmap item 1.1 moves its stages into a Python package. The
command names below are placeholders for that package.

| Timer                        | Schedule (IST)             | Command (placeholder)                             | Healthchecks.io check |
| ---------------------------- | -------------------------- | ------------------------------------------------- | --------------------- |
| `ledger-feeds.timer`         | 00:15, 06:15, 12:15, 18:15 | `ledger run --collect feeds,apis --publish`       | `feeds`               |
| `ledger-pages-hot.timer`     | 03:30, 09:30, 15:30, 21:30 | `ledger run --collect pages --hot 50 --publish`   | `pages-hot`           |
| `ledger-pages-daily.timer`   | 02:00                      | `ledger run --collect pages --discover --publish` | `pages-daily`         |
| `ledger-snapshot.timer`      | 04:00                      | `ledger snapshot --upload --prune-raw 30`         | `snapshot`            |
| `ledger-review-digest.timer` | Monday 10:00               | `ledger review-digest --discord`                  | `review-digest`       |

Each job runs through one wrapper so every job reports the same way:

```bash
#!/usr/bin/env bash
# /srv/laptop-ledger/app/ops/run-job.sh <check-name> <command...>
set -uo pipefail
check="$1"; shift
url_var="HC_PING_URL_${check^^}"; url_var="${url_var//-/_}"
ping() { curl -fsS -m 10 --retry 3 -o /dev/null "${!url_var}$1" || true; }
ping /start
"$@" >> "/srv/laptop-ledger/logs/${check}.log" 2>&1
status=$?
ping "/${status}"
exit "$status"
```

Healthchecks.io treats `/0` as success and any other number as failure, and alerts when a ping does not arrive on
schedule. Example service and timer for one job:

```ini
# /etc/systemd/system/ledger-pages-daily.service
[Unit]
Description=Laptop Ledger: daily page refresh

[Service]
Type=oneshot
User=ledger
WorkingDirectory=/srv/laptop-ledger/app
EnvironmentFile=/etc/laptop-ledger/pipeline.env
ExecStart=/srv/laptop-ledger/app/ops/run-job.sh pages-daily ledger run --collect pages --discover --publish
TimeoutStartSec=3h

# /etc/systemd/system/ledger-pages-daily.timer
[Unit]
Description=Run the daily page refresh

[Timer]
OnCalendar=*-*-* 02:00 Asia/Kolkata
Persistent=true
RandomizedDelaySec=10m

[Install]
WantedBy=timers.target
```

`Persistent=true` runs a missed job after a reboot. Two jobs never write at the same time if each takes a lock
(`flock /srv/laptop-ledger/data/work.lock`) inside the package; the prototype's stages are already idempotent, so a
job that waits and then runs is safe.

## Publishing a new catalogue

**Proposed**, built on behaviour that **exists**: the web app opens the database read-only, reads the whole
catalogue, closes the connection, and reloads when the file's modification time or size changes or after 5 minutes
(`web/src/data/catalogue.ts`).

```bash
cd /srv/laptop-ledger/data
sqlite3 work.sqlite "VACUUM INTO 'catalogue.sqlite.tmp'"
sqlite3 catalogue.sqlite.tmp "PRAGMA integrity_check" | grep -qx ok
cp catalogue.sqlite "published/catalogue-$(date -u +%Y%m%dT%H%M%SZ).sqlite" 2>/dev/null || true
mv -f catalogue.sqlite.tmp catalogue.sqlite     # atomic on the same filesystem
ls -1t published/catalogue-*.sqlite | tail -n +8 | xargs -r rm --
```

Publish only when the run's health checks raised no critical alert, so a broken run never replaces a good
catalogue. Rollback: copy the newest file from `published/` over `catalogue.sqlite`.

## Environment variables

**Exists** (web app and launcher):

| Variable                  | Required | Used by                     | Purpose                                            | Example                                    | Default                        |
| ------------------------- | -------- | --------------------------- | -------------------------------------------------- | ------------------------------------------ | ------------------------------ |
| `LAPTOP_DB_PATH`          | Optional | `web/src/data/catalogue.ts` | Database to read, absolute or relative to `web/`   | `/srv/laptop-ledger/data/catalogue.sqlite` | `../outputs/db/laptops.sqlite` |
| `PORT`                    | Optional | `scripts/dev.mjs`           | Port for `npm run dev`                             | `3001`                                     | `3000`                         |
| `CI`                      | Optional | `scripts/dev.mjs`           | When set, the launcher does not open a browser     | `1`                                        | unset                          |
| `NEXT_TELEMETRY_DISABLED` | Optional | Next.js                     | Turns off Next.js telemetry (the launcher sets it) | `1`                                        | unset                          |

The pipeline notebook has no environment variables; its settings are constants in its configuration cell
([README: Configuration](../README.md#configuration)).

**Proposed** (pipeline service; names are suggestions). Keep them in `/etc/laptop-ledger/pipeline.env`, mode 600:

| Variable                                                                           | Purpose                                           | Notes                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `LEDGER_WORK_DB`, `LEDGER_CATALOGUE_DB`, `LEDGER_RAW_DIR`                          | Paths                                             | Defaults under `/srv/laptop-ledger`                  |
| `LEDGER_CONTACT`                                                                   | Contact added to the User-Agent                   | Replaces the notebook's `CONTACT` constant           |
| `ANTHROPIC_API_KEY` (or the chosen provider's key)                                 | Hosted LLM normalisation                          | Secret; set a spend limit in the provider console    |
| `LEDGER_LLM_MONTHLY_LISTING_CAP`                                                   | Stop normalising after this many listings a month | For example `3000`                                   |
| `FLIPKART_AFFILIATE_ID`, `FLIPKART_AFFILIATE_TOKEN`                                | Flipkart Affiliate API                            | Secret; Flipkart allows one active token per account |
| `AMAZON_CREATORS_CLIENT_ID`, `AMAZON_CREATORS_CLIENT_SECRET`, `AMAZON_PARTNER_TAG` | Amazon Creators API                               | Secret; only once eligible                           |
| `HC_PING_URL_FEEDS`, `HC_PING_URL_PAGES_DAILY`, ...                                | Healthchecks.io ping URL per job                  | Treat as secret (anyone with it can ping)            |
| `DISCORD_WEBHOOK_URL`                                                              | Alerts and the weekly review digest               | Secret                                               |
| `LITESTREAM_ACCESS_KEY_ID`, `LITESTREAM_SECRET_ACCESS_KEY`                         | R2 token limited to the backup bucket             | Secret; used by Litestream, not the pipeline         |

Affiliate parameters per store (Roadmap item 1.5) belong in the `sites` table, not in environment variables, because
they are data that changes per store.

## Backups and restore

**Proposed.**

| What               | How                                                                                       | Retention                               | Restores                                      |
| ------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| `work.sqlite`      | Litestream continuous replication to an R2 bucket                                         | Litestream's default snapshots plus WAL | To any point in the retention window          |
| Daily snapshot     | `VACUUM INTO` a dated file, upload to R2 (`ledger snapshot`)                              | 30 days (R2 lifecycle rule)             | One file, any day                             |
| `catalogue.sqlite` | Not backed up; rebuilt by publishing from `work.sqlite`                                   | Last 7 copies on disk                   | `published/`                                  |
| Raw pages          | Not backed up                                                                             | 30 days on disk                         | Losing them only prevents replaying old pages |
| Configuration      | This repository plus `/etc/laptop-ledger/*.env` kept in the maintainers' password manager | -                                       | Re-create files                               |

Litestream configuration (`/etc/litestream.yml`, check the keys against the installed version):

```yaml
dbs:
  - path: /srv/laptop-ledger/data/work.sqlite
    replicas:
      - type: s3
        bucket: laptop-ledger-backups
        path: work
        endpoint: https://<account-id>.r2.cloudflarestorage.com
        region: auto
        access-key-id: ${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: ${LITESTREAM_SECRET_ACCESS_KEY}
```

Restore drill (quarterly):

```bash
litestream restore -o /tmp/restore-test.sqlite /srv/laptop-ledger/data/work.sqlite
sqlite3 /tmp/restore-test.sqlite "PRAGMA integrity_check; SELECT COUNT(*) FROM seller_listings; SELECT MAX(finished_at) FROM scrape_runs;"
```

The pipeline's resume step already checks a database's integrity and sets a corrupt one aside (notebook section 2.2).

## Logging

| Source                   | Where                                                | Status   |
| ------------------------ | ---------------------------------------------------- | -------- |
| Web app                  | journald: `journalctl -u laptop-ledger-web`          | Proposed |
| Jobs                     | `/srv/laptop-ledger/logs/<job>.log` and journald     | Proposed |
| Every HTTP request made  | `fetch_log` table: URL, time, status, outcome, error | Exists   |
| Stage failures           | `failures` table by stage and item                   | Exists   |
| Stage timings and counts | `run_metrics` table                                  | Exists   |
| Health-check alerts      | `alerts` table and `metrics/health.json`             | Exists   |

Retention: cap journald with `SystemMaxUse=500M`; rotate job logs weekly with logrotate; delete `fetch_log` rows older
than 90 days in the snapshot job. Logs must never contain API keys or webhook URLs.

## Monitoring and alerting

| Signal                                                | Source                                                                                     | Alert when                                         | Channel          | Status                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------- | ---------------- | ------------------------------------- |
| A job did not run or exited non-zero                  | Healthchecks.io                                                                            | Ping missing past its grace time, or `/<non-zero>` | Email or Discord | Proposed                              |
| Fetch error rate per site, bot walls, empty discovery | `alerts` (`ALERT_*` thresholds)                                                            | Threshold crossed in a run                         | Discord          | Thresholds exist; forwarding proposed |
| Extraction failure rate, missing prices, stale share  | `alerts`                                                                                   | Threshold crossed                                  | Discord          | Same                                  |
| LLM failure and truncation rates                      | `alerts`                                                                                   | Threshold crossed                                  | Discord          | Same                                  |
| Site down                                             | Scheduled check (GitHub Actions in a public repository) pinging Healthchecks.io on success | Ping missing                                       | Email or Discord | Proposed                              |
| Prices getting old                                    | `lowest_prices.price_age_hours`                                                            | Median above 24 hours for feed sources             | Weekly digest    | Proposed                              |
| Open review items                                     | `match_candidates`, `price_holds`                                                          | Any open on Monday                                 | Weekly digest    | Proposed                              |
| Disk use                                              | `df` in the snapshot job                                                                   | Above 80%                                          | Discord          | Proposed                              |

## Failure handling and recovery

| Failure                                  | Behaviour                                                                               | Status                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------- |
| Network error or HTTP 429 and 5xx        | Up to 3 retries with exponential backoff and `Retry-After`                              | Exists                  |
| A host keeps failing or shows a bot wall | Circuit breaker stops that host for the run after 5 failures or the first bot wall      | Exists                  |
| One page or listing fails                | Logged in `failures`; the run continues                                                 | Exists                  |
| Run interrupted                          | Every stage selects only pending work; every write is an upsert; re-running resumes     | Exists                  |
| Page layout changes                      | Extraction failure alert; fix the adapter, bump `ADAPTER_VERSION`, replay stored pages  | Exists                  |
| LLM output invalid                       | Retried once, then fields fail validation and become `null`                             | Exists                  |
| Job crashes                              | Non-zero exit pinged to Healthchecks.io; the next timer run retries                     | Proposed                |
| Bad run                                  | Publish step skipped when a critical alert fired; visitors keep the last good catalogue | Proposed                |
| Corrupt database                         | Integrity check fails; restore from Litestream or the latest snapshot                   | Proposed (check exists) |
| Server lost                              | New server from this guide; restore `work.sqlite`; publish; point DNS; about an hour    | Proposed                |
| LLM budget exhausted                     | Listings keep rule values; normalisation resumes next month                             | Proposed                |

## Security

| Area              | Measure                                                                                                      | Status                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------- |
| Database access   | Web app opens SQLite read-only and is the only code that touches the file (`server-only` import)             | Exists                  |
| Outbound links    | `rel="noopener noreferrer nofollow"`; add `sponsored` for affiliate links                                    | Exists, change proposed |
| Secrets           | `.env` files are git-ignored; production secrets only in `/etc/laptop-ledger/*.env`, mode 600, owned by root | Proposed                |
| Process isolation | Service user without a shell; systemd sandboxing options in the unit file                                    | Proposed                |
| Network exposure  | Next.js listens on 127.0.0.1 only; Caddy terminates TLS; Cloudflare in front                                 | Proposed                |
| Admin pages       | Caddy `basic_auth` on `/admin/*` (password hash from `caddy hash-password`), or Cloudflare Access            | Proposed                |
| Backups           | R2 token scoped to one bucket; bucket private                                                                | Proposed                |
| Dependencies      | `npm ci` from the lockfile; `npm audit` and Dependabot alerts; monthly update                                | Proposed                |
| Personal data     | Click counts store listing and time only; no IP addresses or tracking cookies                                | Proposed                |
| Scraping ethics   | robots.txt honoured, rate limited, honest User-Agent, bot walls never bypassed                               | Exists                  |

## Maintenance calendar

| When      | Task                                                                                                                    | Time (estimate)  |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Weekly    | Read the review digest; approve or reject match candidates and price holds                                              | 10 to 20 minutes |
| On alert  | Fix the failing adapter or source; replay stored pages                                                                  | Varies           |
| Monthly   | Update dependencies (`npm ci`, `npm run check`); check LLM spend and free-tier usage; look at click and revenue numbers | 1 hour           |
| Quarterly | Restore drill; re-run the fixture evaluation; re-read the terms of every page-collected store                           | 1 to 2 hours     |
| Yearly    | Re-check every provider's free tier and prices (they changed in 2026); renew permissions                                | 1 hour           |

## Capacity check on a new server

**Exists.** Two scripts in `scripts/` measure the web app without extra dependencies:

```bash
# Build a synthetic catalogue 30 times larger than the committed one (writes a new file; the source is not modified)
node scripts/scale-catalogue-db.mjs outputs/db/laptops.sqlite /tmp/laptops_x30.sqlite 30

# Start the production build against it, then measure for 20 seconds with 8 concurrent requests
LAPTOP_DB_PATH=/tmp/laptops_x30.sqlite npm start &
node scripts/bench-web.mjs http://localhost:3000 20 8 / "/?q=hp&sort=price-desc" "/?page=3"
```

`bench-web.mjs` prints requests, errors, requests per second and p50, p95 and p99 latency as JSON. On Git Bash for
Windows, set `MSYS_NO_PATHCONV=1` first so paths starting with `/` are not rewritten. Results from the author's laptop
are in the [proposal](../PROPOSAL.md#scalability).

## Troubleshooting

| Problem                                          | Likely cause                                   | Diagnostic                                                               | Resolution                                                                   |
| ------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| "The laptop catalogue could not be loaded"       | `LAPTOP_DB_PATH` wrong, or the file is missing | `systemctl show laptop-ledger-web -p Environment`; `ls -l` the path      | Fix the path in `web.env`; publish again                                     |
| Every price says "Price may be out of date"      | No successful run for over 7 days              | `SELECT MAX(last_verified_at) FROM price_history`                        | Check job pings and logs; run the job by hand                                |
| New prices not visible                           | Publish step skipped, or CDN cache             | Job log for "publish skipped"; `curl -sI` the page for `cf-cache-status` | Resolve the alert that blocked publishing; wait 5 minutes or purge the URL   |
| Raw payload text instead of a page after a click | CDN cached a Next.js navigation response       | Response headers of the broken page                                      | Bypass the cache for `RSC` requests and `_rsc` URLs; purge the cache         |
| Healthchecks.io says a job is late               | Timer disabled, job hung, or server down       | `systemctl list-timers 'ledger-*'`; `journalctl -u <job>`                | Re-enable the timer; check `TimeoutStartSec`; check the lock file            |
| `database is locked` in a job                    | Two writers at once                            | `fuser /srv/laptop-ledger/data/work.sqlite`                              | Make sure every job takes the `flock`; never write to `catalogue.sqlite`     |
| One store's offers all stale                     | Store blocks the server, or its layout changed | `SELECT outcome, COUNT(*) FROM fetch_log WHERE site=? GROUP BY 1`        | Bot wall: stop, ask for a feed. Layout: fix the adapter, replay stored pages |
| LLM step stops early                             | Monthly cap or provider budget reached         | Job log; provider console                                                | Expected; raise the cap only if the spend is justified                       |
| Litestream not replicating                       | Credentials or endpoint wrong                  | `journalctl -u litestream`                                               | Fix `/etc/litestream.yml`; run the restore drill                             |
| Disk filling up                                  | Raw pages not pruned, or journald unbounded    | `du -sh /srv/laptop-ledger/*`; `journalctl --disk-usage`                 | Run the snapshot job's prune; set `SystemMaxUse`                             |

Pipeline-specific problems (bot walls, Kaggle GPU errors, model warnings) are covered in the
[README troubleshooting table](../README.md#troubleshooting).
