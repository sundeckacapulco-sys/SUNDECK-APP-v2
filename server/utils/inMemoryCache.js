class InMemoryCache {
  constructor(options = {}) {
    const { stdTTL = 0, checkperiod = 0 } = options;
    this.stdTTL = stdTTL;
    this.store = new Map();

    if (checkperiod > 0) {
      this.cleanupInterval = setInterval(() => this.cleanup(), checkperiod * 1000);
      if (typeof this.cleanupInterval.unref === 'function') {
        this.cleanupInterval.unref();
      }
    }
  }

  set(key, value, ttl) {
    const ttlToUse = typeof ttl === 'number' ? ttl : this.stdTTL;
    const expiresAt = ttlToUse > 0 ? Date.now() + ttlToUse * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  del(key) {
    return this.store.delete(key);
  }

  flushAll() {
    this.store.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }
}

module.exports = InMemoryCache;
