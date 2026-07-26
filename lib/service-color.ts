// lib/service-color.ts
// ─────────────────────────────────────────────────────────────
// Hizmete göre renk. Önceden NextAppointment içinde Türkçe hizmet
// adlarına gömülü bir hex tablosu vardı ('Saç Kesimi': '#D4AF6E' …) —
// başka bir tenant'ın hizmet adları eşleşmediği için tüm hizmetler tek
// renge düşüyordu. Artık renk, tenant'ın kendi hizmet sırasından türer
// ve panel paletinin token'larını kullanır (8 palette de doğru görünür).
// ─────────────────────────────────────────────────────────────

import { CLIENT_CONFIG } from '@/config/client';

/** Panel paletindeki aksan token'ları — her temada tanımlı. */
const ACCENTS = [
  'var(--gold)',
  'var(--rose)',
  'var(--sky)',
  'var(--lavender)',
  'var(--mint)',
  'var(--amber)',
] as const;

const serviceIndex = new Map<string, number>(
  CLIENT_CONFIG.services.map((s, i) => [s.name, i]),
);

/** Hizmet adına karşılık gelen CSS renk değeri (token referansı). */
export function serviceColor(service: string): string {
  const i = serviceIndex.get(service);
  if (i === undefined) {
    // Bilinmeyen hizmet (legacy kayıt / config'den kaldırılmış):
    // ada göre deterministik bir aksan seç, en azından tutarlı kalsın.
    let h = 0;
    for (let k = 0; k < service.length; k++) h = (h * 31 + service.charCodeAt(k)) >>> 0;
    return ACCENTS[h % ACCENTS.length];
  }
  return ACCENTS[i % ACCENTS.length];
}
