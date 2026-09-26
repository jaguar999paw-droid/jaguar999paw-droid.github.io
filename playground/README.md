# Playground — hands-on JS practice

Scratch space for practicing the pieces `ARCHITECTURE.md` describes but
aren't built yet. Nothing in here is wired into the live site — these
are standalone stubs with TODOs, not production code. When one is
actually working, *you* decide whether/how it graduates into
`functions/api/`.

## How to use a stub

Each file has: **Goal**, **Concepts**, a starter skeleton with `// TODO`
markers, a stretch goal, and 1-2 links. Fill in the TODOs, run it, break
it, fix it. No answer key on purpose.

Quick local loop for anything Workers-flavored (most of these):
```bash
npx wrangler pages dev .          # gives you the Workers runtime locally
# or, for pure logic with no Workers APIs, just:
node playground/exceptions/retry-circuit-breaker.stub.js
```

## Topics

| Dir | Practicing | Maps to |
|---|---|---|
| `db/` | D1 queries, KV cache-aside pattern | ARCHITECTURE.md "Data layer" (currently unimplemented) |
| `api/` | Rate limiting (Durable Object), the homelab adapter pattern | "API surface" / "External homelab integration" |
| `api/service-mesh-lite.stub.js` | Service registry, load balancing, token-bucket rate limiting (pure JS objects, no Workers APIs) | prep for `portfolio-gateway`'s multi-portfolio backend |
| `security/` | CSP/HSTS/CORS middleware, Turnstile verification | "Security baseline" |
| `automation/` | Cron Triggers, a GitHub Actions deploy workflow | not yet in ARCHITECTURE.md — your call whether it belongs |
| `animations/` | Canvas particles, SVG path morphing | beyond what `assets/js/main.js` already has |
| `events/` | Pub/sub with `EventTarget`, deeper delegation (drag, keyboard nav) | builds on the click-delegation already in `main.js` |
| `exceptions/` | Custom `Error` subclasses, retry + circuit breaker | not yet formalized anywhere in the codebase |

Work in whatever order interests you — they're independent.
