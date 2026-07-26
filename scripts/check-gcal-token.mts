/**
 * Google Calendar refresh_token sağlık kontrolü — SALT OKUNUR.
 *
 * `.env.local` içindeki GOOGLE_REFRESH_TOKEN'ı Google'ın token endpoint'ine
 * karşı dener ve sonucu raporlar. Takvime hiçbir şey yazmaz, hiçbir event
 * oluşturmaz. Rotation SOP'unun Adım 3'ünü prod'a gitmeden yapılabilir kılar:
 * yeni token'ı .env.local'e yapıştır → bu script'i koş → yeşilse Vercel'e bas.
 *
 * GÜVENLİK: token/secret DEĞERLERİ asla yazdırılmaz — yalnız var/yok,
 * uzunluk ve Google'ın döndürdüğü hata kodu raporlanır.
 *
 * Koşum: npx tsx scripts/check-gcal-token.mts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const id = process.env.GOOGLE_CLIENT_ID;
const secret = process.env.GOOGLE_CLIENT_SECRET;
const refresh = process.env.GOOGLE_REFRESH_TOKEN;
const calId = process.env.GOOGLE_CALENDAR_ID;

function mask(v?: string) {
  return v ? `var (${v.length} karakter)` : 'YOK';
}

console.log('\n── Env değişkenleri (değerler gösterilmez) ──');
console.log(`  GOOGLE_CLIENT_ID       : ${mask(id)}`);
console.log(`  GOOGLE_CLIENT_SECRET   : ${mask(secret)}`);
console.log(`  GOOGLE_REFRESH_TOKEN   : ${mask(refresh)}`);
console.log(`  GOOGLE_CALENDAR_ID     : ${calId ? 'var' : 'YOK'}`);

if (!id || !secret || !refresh) {
  console.log('\n❌ Zorunlu değişken eksik — rotation SOP Adım 1\'e bak.\n');
  process.exit(1);
}

console.log('\n── Google token endpoint denemesi ──');
const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: id,
    client_secret: secret,
    refresh_token: refresh,
    grant_type: 'refresh_token',
  }),
});

const body = (await res.json()) as {
  error?: string; error_description?: string; expires_in?: number; scope?: string;
};

if (res.ok && !body.error) {
  console.log(`  ✅ TOKEN GEÇERLİ — access_token alındı (${body.expires_in}s geçerli)`);
  console.log(`  scope: ${body.scope ?? '(bildirilmedi)'}`);
  console.log('\n  Sonraki adım: Vercel Production env\'ine aynı token\'ı bas + redeploy.\n');
  process.exit(0);
}

console.log(`  ❌ TOKEN GEÇERSİZ — HTTP ${res.status}`);
console.log(`  error: ${body.error}`);
console.log(`  açıklama: ${body.error_description ?? '(yok)'}`);

if (body.error === 'invalid_grant') {
  console.log(`
  Bu hata şu anlamlardan birine gelir:
    · OAuth Consent Screen "Testing" modunda → refresh_token 7 günde bir ölür
    · Token manuel revoke edildi / hesap parolası değişti
    · 6 ay kullanılmadı

  ⚠️  Rotation'dan ÖNCE Publishing status'u kontrol et. "Testing" ise önce
      "Publish App" yap — yoksa yeni token da 7 gün sonra ölür.
      Google Cloud Console → APIs & Services → OAuth consent screen
`);
}
process.exit(1);
