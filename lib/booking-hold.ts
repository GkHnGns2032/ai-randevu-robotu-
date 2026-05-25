// Slot picker cross-session hold — 5 dk in-memory TTL.
// Vercel multi-instance'ta her instance kendi map'i (rate-limit.ts ile aynı pattern);
// Bella ölçeğinde yeterli, BD4+ Upstash refactor'üyle birlikte yeniden ele alınır.

type HoldRecord = { expiresAt: number };

const HOLD_TTL_MS = 5 * 60 * 1000;
const holds = new Map<string, HoldRecord>();

function holdKey(date: string, time: string, staffId?: string): string {
  return `${date}|${time}|${staffId ?? '*'}`;
}

function cleanup(): void {
  const now = Date.now();
  for (const [key, rec] of holds) {
    if (rec.expiresAt < now) holds.delete(key);
  }
}

export function holdSlot(date: string, time: string, staffId?: string): void {
  cleanup();
  holds.set(holdKey(date, time, staffId), { expiresAt: Date.now() + HOLD_TTL_MS });
}

export function releaseSlot(date: string, time: string, staffId?: string): void {
  holds.delete(holdKey(date, time, staffId));
}

export function isSlotHeld(date: string, time: string, staffId?: string): boolean {
  const rec = holds.get(holdKey(date, time, staffId));
  if (!rec) return false;
  if (rec.expiresAt < Date.now()) {
    holds.delete(holdKey(date, time, staffId));
    return false;
  }
  return true;
}
