// config/client.ts
// ─────────────────────────────────────────────────────────────
// Multi-tenant Yol A loader (Aşama 0-1: tek tenant tek deploy).
// NEXT_PUBLIC_CLIENT_ID env'e göre config/clients/<slug>.ts modülü seçer.
// Yeni tenant: config/clients/<slug>.ts oluştur + aşağıdaki clients map'e ekle.
// Aşama 2 (Yol C runtime multi-tenant migration) eşiği: 8-10 müşteri.
// ─────────────────────────────────────────────────────────────

import * as bella from './clients/bella';
import * as demo from './clients/demo';

const clients = {
  bella,
  demo, // örnek tenant — onboarding şablonu, gerçek müşteri değil
} as const;

type ClientId = keyof typeof clients;

const envClientId = process.env.NEXT_PUBLIC_CLIENT_ID;
const clientId: ClientId =
  envClientId && envClientId in clients ? (envClientId as ClientId) : 'bella';

if (envClientId && !(envClientId in clients)) {
  console.warn(
    `[config/client] NEXT_PUBLIC_CLIENT_ID="${envClientId}" tanımlı değil. Düşülen tenant: "bella". Available: ${Object.keys(clients).join(', ')}`,
  );
}

export const CLIENT_CONFIG = clients[clientId].CLIENT_CONFIG;

// ServiceName: Aşama 0-1'de tek tenant olduğu için bella literal'inden türer.
// Aşama 2 (Yol C migration) sırasında tüm tenant'ların service union'ına dönüştürülür.
export type ServiceName = (typeof clients)['bella']['CLIENT_CONFIG']['services'][number]['name'];
