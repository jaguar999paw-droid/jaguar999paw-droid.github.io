# Architecture

## Platform
Deployed on **Cloudflare Workers with static assets** (not Pages) — unifies the static
frontend and API behind one `wrangler.jsonc`, and unlocks Durable Objects / Queues /
Cron Triggers, which Pages does not support.

- Config: `wrangler.jsonc`
- Environments: `staging`, `production` (see `package.json` scripts: `deploy:staging`, `deploy:prod`)
- Compatibility date pinned and reviewed monthly.

## Data layer
| Store | Binding | Used for |
|---|---|---|
| D1 (SQLite) | `DB` | Structured content: projects, writeups, posts |
| KV | `CACHE` | Hot reads, response caching for external calls |
| R2 | `ASSETS_R2` | Resume, OG images, static binary assets |
| Durable Object | `RATE_LIMITER` / `LIVE_STATS` | Stateful coordination (rate limiting, live counters) |

## API surface
All frontend calls go through a single same-origin `/api/*` surface. Handlers are
adapters over specific backends (GitHub API, internal D1 queries, a scoped homelab
endpoint) so the client never talks to third parties directly. Each adapter has its
own timeout and KV-backed cache TTL, so a slow or unavailable upstream degrades to
stale-but-served data rather than a broken page.

## External homelab integration
One narrow, read-only, token-authenticated endpoint is exposed from private
infrastructure via a reverse proxy with its own TLS termination — never the
infrastructure itself. Access to that endpoint is restricted at two independent
layers: network-level ACLs on the private side, and a bearer token checked by the
Worker adapter. The Worker caches responses in KV; homelab downtime degrades the
relevant widget rather than the site.

Private administrative access to the underlying infrastructure (SSH, dashboards) is
kept on a separate private mesh network entirely and never exposed to or reachable
from public request handlers.

## Telemetry
- Workers Logs enabled (`observability.enabled = true`) — structured logs, no extra service.
- `wrangler tail --env production` for live debugging.
- Optional: Workers Analytics Engine binding for custom route/error metrics.

## Security baseline
- CSP, `X-Content-Type-Options`, `Referrer-Policy`, HSTS set on every response.
- CORS on `/api/*` restricted to the site's own origin.
- Cloudflare Rate Limiting Rules on `/api/*`.
- Turnstile on any form endpoint.
- Secrets managed via `wrangler secret put --env <env>`; never committed. `.dev.vars`
  and any real hostnames/IPs are gitignored.

## Local dev
```
npm run dev              # wrangler dev, local-first, workerd runtime
npm run deploy:staging
npm run deploy:prod
npm run tail:prod
```

## Multi-portfolio platform

This site is frontend #1 on the personal plane of a wider platform
designed to host several isolated portfolios behind one shared backend.
Full strategy, tiering, and rollout plan: see the
[`portfolio-gateway`](https://github.com/jaguar999paw-droid/portfolio-gateway)
repo's `PLATFORM_STRATEGY.md`. This site's own `/api/hello` Pages
Function is unaffected and continues to work standalone; the gateway is
additive infrastructure for future portfolios, not a replacement.
