// lib/pricing.ts
import { CLIENT_CONFIG, type ServiceName } from '@/config/client';

export const SERVICE_PRICES: Record<ServiceName, number> = Object.fromEntries(
  CLIENT_CONFIG.services.map((s) => [s.name, s.price])
) as Record<ServiceName, number>;

export function priceOf(service: string): number {
  return SERVICE_PRICES[service as ServiceName] ?? 0;
}
