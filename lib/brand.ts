// lib/brand.ts
// ─────────────────────────────────────────────────────────────
// Tenant marka bloğunu (config/clients/<slug>.ts → CLIENT_CONFIG.brand)
// CSS değişkenlerine çevirir. app/layout.tsx bunu <html> üzerine inline
// style olarak basar; böylece renkler ilk boyamada doğrudur (FOUC yok) ve
// app/globals.css :root içindeki --c-* varsayılanlarını ezer.
//
// Anahtar dönüşümü: camelCase → --c-kebab-case
//   brand           → --c-brand
//   brandTintStrong → --c-brand-tint-strong
//   confetti1       → --c-confetti-1
// ─────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react';
import { CLIENT_CONFIG } from '@/config/client';

/** CSS değişkeni olmayan, davranışsal anahtarlar — style'a basılmaz. */
const NON_CSS_KEYS = new Set(['dashboardTheme']);

/** Panel paleti seçenekleri — ThemeProvider ile aynı liste. */
export const DASHBOARD_THEMES = [
  'obsidian', 'endeks', 'endeks-gece', 'vitrin', 'vitrin-gece',
  'ivory', 'rose', 'ocean', 'emerald', 'amethyst', 'beige', 'midnight',
] as const;

export type DashboardTheme = (typeof DASHBOARD_THEMES)[number];

export function toCssVarName(key: string): string {
  return (
    '--c-' +
    key
      .replace(/([A-Z])/g, '-$1')
      .replace(/(\d+)/g, '-$1')
      .toLowerCase()
  );
}

type BrandRecord = Record<string, string>;

/** Tenant'ın brand bloğu (yoksa boş — globals.css varsayılanları geçerli kalır). */
function readBrand(): BrandRecord {
  const brand = (CLIENT_CONFIG as { brand?: BrandRecord }).brand;
  return brand ?? {};
}

/**
 * <html> elementine verilecek inline style: tenant'ın tanımladığı her marka
 * anahtarı bir --c-* değişkenine dönüşür. Tanımlanmayan anahtarlar
 * globals.css :root varsayılanında kalır.
 */
export function brandStyle(): CSSProperties {
  const brand = readBrand();
  const style: Record<string, string> = {};

  for (const [key, value] of Object.entries(brand)) {
    if (NON_CSS_KEYS.has(key) || typeof value !== 'string') continue;
    style[toCssVarName(key)] = value;
  }

  return style as CSSProperties;
}

/** Panelin açılış paleti — geçersiz/eksik değerde 'obsidian'. */
export function defaultDashboardTheme(): DashboardTheme {
  const raw = readBrand().dashboardTheme;
  return DASHBOARD_THEMES.includes(raw as DashboardTheme)
    ? (raw as DashboardTheme)
    : 'obsidian';
}
