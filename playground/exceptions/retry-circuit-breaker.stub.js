/**
 * PRACTICE: Retry + Circuit Breaker — the resilience pattern every service
 * mesh sidecar (Envoy/Linkerd) gives you for free at the network layer.
 * Here you build the object yourself, in plain JS, so you feel exactly
 * what the sidecar is doing on your behalf.
 *
 * GOAL
 *   Two small classes that compose: RetryPolicy wraps a flaky async call
 *   with backoff; CircuitBreaker wraps RetryPolicy so that once a
 *   downstream is clearly down, you stop hammering it and fail fast
 *   instead — exactly the "degrade gracefully" idea in ARCHITECTURE.md's
 *   homelab adapter, but as a reusable object instead of one-off logic.
 *
 * CONCEPTS
 *   - Exponential backoff with jitter (thundering herd avoidance)
 *   - Circuit breaker states: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 *   - Custom Error subclasses so callers can `instanceof` check *why*
 *     a call failed (CircuitOpenError vs the original upstream error)
 *   - Composition over inheritance: CircuitBreaker HAS-A RetryPolicy,
 *     doesn't extend it
 *
 * RUN IT (pure logic, no Workers APIs needed):
 *   node playground/exceptions/retry-circuit-breaker.stub.js
 */

// TODO 1: give this a `name` and a `retryable` flag — not every error
// should trigger a retry (e.g. a 400 shouldn't, a 503 should).
class UpstreamError extends Error {
  constructor(message, { retryable = true } = {}) {
    super(message);
    // TODO: set this.name = 'UpstreamError' and this.retryable
  }
}

// TODO 2: thrown by CircuitBreaker itself when the circuit is OPEN —
// the call never even reaches the upstream fn.
class CircuitOpenError extends Error {
  constructor(message) {
    super(message);
  }
}

class RetryPolicy {
  constructor({ maxAttempts = 3, baseDelayMs = 200 } = {}) {
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
  }

  // TODO 3: call `fn()`. On a retryable failure, wait
  // baseDelayMs * 2^attempt + Math.random() * baseDelayMs (jitter), then
  // retry, up to maxAttempts. On a non-retryable error (check
  // err.retryable === false), throw immediately — don't waste attempts.
  async execute(fn) {
    throw new Error('not implemented yet');
  }
}

class CircuitBreaker {
  static STATE = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

  constructor({ failureThreshold = 5, cooldownMs = 5000, retryPolicy } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.retryPolicy = retryPolicy ?? new RetryPolicy();
    this.state = CircuitBreaker.STATE.CLOSED;
    this.failureCount = 0;
    this.openedAt = null;
  }

  // TODO 4: the main entry point.
  //   - If state is OPEN and cooldownMs hasn't passed since openedAt,
  //     throw a CircuitOpenError immediately (fail fast, no network call).
  //   - If cooldownMs HAS passed, move to HALF_OPEN and allow exactly one
  //     trial call through.
  //   - Otherwise (CLOSED or the HALF_OPEN trial), run fn() through
  //     this.retryPolicy.execute(fn).
  //   - On success: reset failureCount to 0, state -> CLOSED.
  //   - On failure: increment failureCount; if it hits failureThreshold
  //     (or the HALF_OPEN trial itself failed), state -> OPEN,
  //     openedAt = Date.now(). Re-throw the original error either way.
  async call(fn) {
    throw new Error('not implemented yet');
  }
}

// STRETCH GOAL: wire this into playground/api/homelab-adapter.stub.js —
// wrap the homelab fetch in a CircuitBreaker instead of a bare
// AbortController timeout, so repeated homelab outages stop generating
// load on the Worker entirely, not just degrade one request at a time.

// --- quick manual test harness, delete or rewrite once your impl works ---
async function main() {
  let calls = 0;
  const flaky = async () => {
    calls++;
    if (calls < 4) throw new UpstreamError(`simulated failure #${calls}`);
    return 'ok';
  };

  const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 });
  try {
    const result = await breaker.call(flaky);
    console.log('result:', result, 'total calls:', calls);
  } catch (err) {
    console.log('failed as expected (fill in the TODOs!):', err.message);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = { UpstreamError, CircuitOpenError, RetryPolicy, CircuitBreaker };
