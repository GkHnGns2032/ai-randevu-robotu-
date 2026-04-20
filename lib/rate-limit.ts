// Not: Vercel'de her instance'ın kendi buckets'ı var. Ciddi rate limit için Upstash Redis kullanılmalı (Faz 6'da).
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  existing.count++;
  return { allowed: true, remaining: limit - existing.count };
}
