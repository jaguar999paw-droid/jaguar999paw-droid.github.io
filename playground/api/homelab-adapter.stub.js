/**
 * PRACTICE: the "narrow, token-authenticated homelab endpoint" pattern
 * described in ARCHITECTURE.md, without ever exposing the homelab itself.
 *
 * GOAL
 *   Write a Function that calls ONE specific endpoint on dizaster (behind
 *   your Cloudflare Tunnel), with a timeout, a bearer token, and a graceful
 *   fallback to cached/stale data if the homelab is unreachable.
 *
 * CONCEPTS
 *   - AbortController timeout (you already used this in assets/js/main.js
 *     for the backend-status ping — same idea, server-side this time)
 *   - Never trust upstream uptime: cache-then-refresh, don't block the page
 *     on a homelab that might be down
 *   - Secrets: the bearer token belongs in `wrangler pages secret put`,
 *     never in code
 */

const TIMEOUT_MS = 3000;
const STALE_CACHE_KEY = 'homelab:last-good';

export async function onRequestGet(context) {
  const { env } = context;

  // TODO 1: build the request to your homelab endpoint (via the Cloudflare
  // Tunnel hostname), with an Authorization header from env.HOMELAB_TOKEN
  // (set via `wrangler pages secret put HOMELAB_TOKEN`).

  // TODO 2: race it against an AbortController timeout of TIMEOUT_MS.

  // TODO 3: on success — write the fresh response into KV under
  // STALE_CACHE_KEY, return it.

  // TODO 4: on failure/timeout — read STALE_CACHE_KEY from KV instead, and
  // return that with a header flagging it as stale, e.g.
  // `X-Data-Freshness: stale`. Never let a homelab outage 500 the page.

  return new Response(JSON.stringify({ error: 'not implemented yet' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
}

// STRETCH GOAL: turn the timeout+fallback logic into a reusable
// `fetchWithFallback(url, opts, cacheKey, env)` helper you could use for
// any external call, not just this one.
