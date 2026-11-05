import { logger } from "../lib/logger";

/**
 * In-memory idempotency cache with TTL expiration.
 * Prevents re-processing duplicate webhook events (e.g. from GitHub delivery retries).
 */
export class IdempotencyStore {
  private cache: Map<string, number> = new Map();
  private readonly defaultTtlMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(ttlMs: number = 60 * 60 * 1000) { // default 1 hour TTL
    this.defaultTtlMs = ttlMs;
    this.startCleanupTimer();
  }

  /**
   * Check whether an event ID has already been seen and is still valid.
   */
  isDuplicate(eventId: string): boolean {
    const expiresAt = this.cache.get(eventId);
    if (!expiresAt) {
      return false;
    }
    if (Date.now() > expiresAt) {
      this.cache.delete(eventId);
      return false;
    }
    logger.warn(`Duplicate webhook event detected: ${eventId}`);
    return true;
  }

  /**
   * Mark an event ID as processed with a TTL.
   */
  markProcessed(eventId: string, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs || this.defaultTtlMs);
    this.cache.set(eventId, expiresAt);
  }

  /**
   * Remove expired items periodically.
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, expiresAt] of this.cache.entries()) {
        if (now > expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 10 * 60 * 1000); // Clean up every 10 minutes

    // Don't keep Node process alive solely for cleanup timer
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clear(): void {
    this.cache.clear();
  }
}

export const idempotencyStore = new IdempotencyStore();
export default idempotencyStore;
