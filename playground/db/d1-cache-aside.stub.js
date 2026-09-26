/**
 * PRACTICE: D1 (SQL) + KV cache-aside pattern
 *
 * GOAL
 *   Read "projects" from D1, but don't hit the DB on every request —
 *   check KV first, fall back to D1 on a miss, then populate KV.
 *
 * CONCEPTS
 *   - D1 prepared statements (.prepare().bind().all())
 *   - Cache-aside: check cache -> miss -> read source -> write cache -> return
 *   - Cache TTL and invalidation (what happens when a project is edited?)
 *   - Bindings: this expects `env.DB` (D1) and `env.CACHE` (KV) — add both
 *     to wrangler.jsonc before this can actually run.
 *
 * TRY THIS FIRST
 *   1. `npx wrangler d1 create portfolio-db` (creates a real D1 instance)
 *   2. Add the binding it prints to wrangler.jsonc as `DB`
 *   3. `npx wrangler d1 execute portfolio-db --command "CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT, blurb TEXT)"`
 */

const CACHE_TTL_SECONDS = 300;

export async function getProjects(env) {
  const cacheKey = 'projects:all';

  // TODO 1: try env.CACHE.get(cacheKey, 'json') first — if it hits, return it
  // immediately and skip the DB entirely.

  // TODO 2: on a miss, query D1:
  //   const { results } = await env.DB.prepare('SELECT * FROM projects').all();

  // TODO 3: write the result into KV before returning:
  //   await env.CACHE.put(cacheKey, JSON.stringify(results), { expirationTtl: CACHE_TTL_SECONDS });

  throw new Error('not implemented yet');
}

// STRETCH GOAL: add an `invalidateProjectsCache(env)` function and call it
// from wherever projects get edited, so stale data never outlives an edit
// by more than the TTL — but also never longer than necessary.

// Resources:
// - https://developers.cloudflare.com/d1/
// - https://developers.cloudflare.com/kv/concepts/how-kv-works/
