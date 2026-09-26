/**
 * PRACTICE: the two decisions a service mesh's data plane makes on every
 * request, before your business logic even runs — "which healthy
 * instance do I send this to?" (discovery + load balancing) and "should
 * I let this through at all?" (rate limiting). This site only has one
 * backend today so it's overkill in production, but it's the natural
 * next step once `portfolio-gateway` fronts multiple portfolios behind
 * one shared backend (see ARCHITECTURE.md "Multi-portfolio platform").
 *
 * GOAL
 *   Three small, independent objects:
 *     - ServiceRegistry: instances register/deregister, with a
 *       heartbeat TTL so dead ones drop out automatically.
 *     - LoadBalancer: given a healthy instance list, picks one —
 *       implement round-robin first, weighted-random as the stretch.
 *     - TokenBucket: the rate limiter algorithm behind ARCHITECTURE.md's
 *       `RATE_LIMITER` Durable Object binding.
 *
 * CONCEPTS
 *   - Service discovery: a registry is just a Map with TTLs, not magic
 *   - Load balancing strategies: round-robin vs weighted vs least-conn
 *   - Token bucket vs sliding window rate limiting (token bucket allows
 *     controlled bursts; sliding window is stricter — trade-offs, not
 *     one true answer)
 *   - Durable Objects give you ONE consistent instance per key globally
 *     (e.g. per client IP) — that's what makes a real distributed rate
 *     limiter possible at the edge. This stub is the algorithm; wiring
 *     it into a Durable Object class is the stretch goal.
 *
 * RUN IT (pure logic, no Workers APIs needed):
 *   node playground/api/service-mesh-lite.stub.js
 */

class ServiceRegistry {
  constructor({ heartbeatTtlMs = 10000 } = {}) {
    this.instances = new Map(); // id -> { meta, weight, lastSeen }
  }

  // TODO 1: upsert an instance: id, optional weight (default 1), and
  // set lastSeen = Date.now().
  register(id, { weight = 1 } = {}) {
    throw new Error('not implemented yet');
  }

  deregister(id) {
    this.instances.delete(id);
  }

  // TODO 2: same as register — an instance calling this periodically is
  // how the registry knows it's still alive.
  heartbeat(id) {
    throw new Error('not implemented yet');
  }

  // TODO 3: return only instances whose lastSeen is within
  // heartbeatTtlMs of now — this is what makes dead instances
  // disappear from load balancing without anyone explicitly
  // deregistering them.
  healthyInstances() {
    throw new Error('not implemented yet');
  }
}

class LoadBalancer {
  constructor(registry) {
    this.registry = registry;
    this._rrIndex = 0;
  }

  // TODO 4: round-robin over registry.healthyInstances(). Handle the
  // empty case (throw or return null — your call, just be consistent).
  next() {
    throw new Error('not implemented yet');
  }

  // STRETCH: nextWeighted() — instances with weight:2 should be picked
  // roughly twice as often as weight:1. (Hint: build a flattened pool,
  // or use cumulative-weight + Math.random().)
}

class TokenBucket {
  constructor({ capacity = 10, refillPerSecond = 1 } = {}) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  // TODO 5: before checking tokens, refill based on elapsed time:
  //   elapsedSeconds * refillPerSecond, capped at `capacity`.
  // Then: if tokens >= 1, consume one and return true (allowed).
  // Otherwise return false (rate-limited) and consume nothing.
  tryConsume() {
    throw new Error('not implemented yet');
  }
}

// STRETCH GOAL: a Durable Object class (needs `npx wrangler pages dev .`,
// not plain node) that holds one TokenBucket per client IP — that's a
// real, globally-consistent distributed rate limiter, no shared external
// store needed, because Durable Objects guarantee a single instance per
// ID across Cloudflare's whole network.

// --- quick manual test harness, delete or rewrite once your impl works ---
function main() {
  const registry = new ServiceRegistry();
  registry.register('worker-a', { weight: 2 });
  registry.register('worker-b');
  console.log('healthy:', registry.healthyInstances());

  const lb = new LoadBalancer(registry);
  for (let i = 0; i < 4; i++) console.log('picked:', lb.next());

  const bucket = new TokenBucket({ capacity: 3, refillPerSecond: 1 });
  for (let i = 0; i < 5; i++) console.log('allowed?', bucket.tryConsume());
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = { ServiceRegistry, LoadBalancer, TokenBucket };
