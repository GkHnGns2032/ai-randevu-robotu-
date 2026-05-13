---
name: bella-bug-fix-cycle
description: Use when Gökhan reports a Bella bug, regression, or runtime error — phrases like "BD3-B4 fix", "şu bug'u düzelt", "runtime hatası var", "production'da X kırıldı", "müşteri Y bildirdi", "Vercel log'da Z görünüyor", or any non-trivial defect in repos/bella/. Triggers when bug fix needs full discipline: hybrid suitability check → plan → approval → atomic commit → push approval → smoke test → tag → vault HL entry. Do NOT use for one-line typos (tactical, just fix) or for new features (use bella-bd-turu-acilis). Always invoke when fix scope is uncertain or touches more than one file — the suitability check itself decides whether full cycle or shortcut applies.
---

# Bella Bug Fix Döngüsü

## Amaç

Bella'da bug/regresyon/runtime hatası bildirildiğinde, **hibrid uygunluk kontrolü** ile başla, sonra disiplinli 10 adımlı döngüyü uygula. Amaç: aceleyle yamayıp canlıda yeni regresyon üretmemek + her anlamlı hata'yı vault hata-logu'na pattern olarak kaydetmek.

**Neden:** Hata-logu pattern özeti 2026Q2'de "doğrulama atlama" + "Vercel-specific" + "büyük refactor regression" ilk 3 nedendi. BD-UI-1-K1.5'te 22 gün fark edilmemiş localStorage regresyonu örneği — disiplinli fix döngüsü olmasaydı pattern yakalanmazdı.

## Tetikleyici Cümleler

- "BD3-B4 fix yapalım" / "BD<N>-B<X>" bug pattern
- "Şu bug'u düzelt" + Bella context (kod, runtime, davranış)
- "Runtime hatası var: [error msg]"
- "Production'da X çalışmıyor" / "Vercel log'da Y görünüyor"
- "Müşteri Z bildirdi" — regresyon
- Anthropic/Airtable/Clerk/Twilio API hatası Bella'da

## Tetikleyici DEĞİL

- Tek satır typo, değişken adı, CSS rengi — **taktiksel, doğrudan yap, sonra raporla** (vault `delegation-detay.md` Taktiksel kategori)
- Yeni özellik isteği — `bella-bd-turu-acilis` ile yeni BD turu aç
- Vault dosyası bug'u — vault skill'lerine git
- "Şu nasıl çalışıyor" soruları — bug değil, açıklama

## Döngü — 10 Adım

### Adım 1: Hibrid Uygunluk Kontrolü

Bug'a koymadan önce 3 soruyu cevapla:

| Soru | Cevap "evet" ise |
|---|---|
| **Tek atomik commit'e sığar mı?** (bir kök neden, bir fix) | Standart döngü |
| **3+ dosyaya yayılıyor mu?** | **KRİTİK kategori** — daha fazla onay, scope tartışması |
| **Geri alınamaz etki mi?** (DB migration, prod data, env değişiklik) | **DUR + açık onay** + `bella-onay-gateway` |

Cevaplardan birine "emin değilim" diyorsan: scope açık değil → **önce keşif** (`state-reconcile-evrensel` skill). Doğrudan fix'e geçme.

### Adım 2: Plan Sun

Şu şablonu doldur (boş bırakma — "doğrulanamadı" yaz):

```markdown
## Bug Fix Plan — [BD<N>-B<X> veya konu]

### Semptom
- Ne oldu? (kullanıcının/error log'un dediği)
- Ne olmalıydı? (beklenen davranış)
- Ne zamandan beri? (regresyon ise hangi commit'te kırıldı — `git log -S "<symbol>" --oneline` çalıştır)

### Root Cause Hipotezi
- [Kanıt-bazlı, varsayım değil. Hipotezi destekleyen log/kod referansı ver]

### Fix Stratejisi
- Dokunulacak dosya(lar): `<path>:<line-range>`
- Değişiklik özeti: [1-2 cümle]
- Side effect analizi: [bu fix başka neyi etkileyebilir]

### Test/Doğrulama Planı
- Local: `npm run dev` + [hangi endpoint/UI etkileşim]
- Lint/typecheck: `npm run lint && npx tsc --noEmit`
- (Varsa) test suite: `npm test -- [pattern]`
- Smoke test'i `bella-dev-smoke-test` skill'i yürütür (Adım 7)

### Risk
- [Hata kategorisi: küçük / anlamlı / kritik — vault `hata-politikasi.md`]
- [Geri alma stratejisi: revert? force-with-lease? tag rollback?]

### Beklenen Onay
- Plan OK mi?
- Branch adı önerim: `fix-<konu>` veya `BD<N>-B<X>`
- Anchor tag öncesi: `v<M.m>-<konu>-baseline` (öneri)
```

### Adım 3: Açık Onay
"Yap" yetmez. Plan sunduktan sonra Gökhan açık ifade ile onaylamalı (vault `delegation-detay.md` Stratejik kategori). 3+ dosya veya geri alınamaz etki varsa **Kritik onay** — `bella-onay-gateway` skill'ini tetikle.

### Adım 4: Branch Aç
```bash
git checkout master
git pull origin master
git status        # temiz mi doğrula
git checkout -b <branch-adı>
```
**Master'a dokunma.** Master = canlı.

### Adım 5: Atomik Commit
Bir bug = bir commit. Composite ise her bağımsız parça ayrı commit.

```bash
git add <spesifik dosyalar>     # `git add .` veya `-A` yasak (secret sızıntısı riski)
git commit -m "fix(<scope>): <konu>"
```

Commit prefix: `fix:` (bug fix), `refactor:` (davranış aynı), `chore:` (build/config). Commit BODY Türkçe, başlık İngilizce.

### Adım 6: Commit Raporu + Push Onayı
Push'tan önce sun (push KRİTİK):

- Commit hash (kısa) + mesaj
- `git diff --stat HEAD~1` çıktısı
- Eklenen iskelet özeti (~15-20 satır, struktur görünsün)
- "Push edilsin mi?" sorusu

Gökhan açık "evet/push/onay" demeden:
```bash
git push -u origin <branch-adı>
```
çalıştırma. `-u` flag standart (upstream tracking — hata-logu 2026-05-06 pattern).

### Adım 7: Smoke Test (Doğrulama)
`bella-dev-smoke-test` skill'ini tetikle. Browser'da (veya Vercel preview'da) fix'i doğrula. **Memory'den "muhtemelen çalışır" varsayma** — gerçekten test et.

### Adım 8: Master Merge + Kapanış Tag (KRİTİK)
`bella-onay-gateway` zorunlu. Onay sonrası:
```bash
git checkout master
git merge <branch-adı>          # veya --no-ff
git push origin master
git tag -a v<M.m+1>-<konu> -m "<açıklama>"
git push origin v<M.m+1>-<konu>
```

### Adım 9: Vault HL Kaydı
Hata kategorisi **anlamlı veya kritik** ise `vault-hl-kayit` skill'ini tetikle. Küçük/etkisiz hata için log gerekmez (vault `hata-politikasi.md`).

### Adım 10: Branch Silme (Opsiyonel)
```bash
git branch -d <branch-adı>
git push origin --delete <branch-adı>
```
Opsiyonel — bazen referans için tutmak iyi. Tag her zaman kaldığı için silme veri kaybı değil.

## Davranış Kuralları

### Adım atlama yasak
10 adımın hepsi geçer. "Bu küçük, smoke test'siz olur" diyemezsin — küçük olduğunu Adım 1'deki hibrid kontrolü belirler, oradan da atlayamazsın çünkü kontrol = adım.

### Root cause'a kadar in
"Çalıştı tamam" demek = patch. Root cause'u Adım 2'de yaz. Bilmiyorsan "doğrulanamadı, hipotez: X" yaz, körü körüne fix atma.

### `git add .` / `-A` yasak
Untracked dosya secret olabilir (.env.local, cookies.txt, geçici export). Spesifik dosya ekle.

### Force push yasak (Bug fix turunda)
Bug fix turu master'a indikten sonra `--force` ihtiyacı varsa STRATEJİK karar — ayrı plan, ayrı onay. Default: revert commit (yumuşak yol).

### "Hızlıca" tuzak cümlesi
Gökhan "şunu hızlıca düzeltsin" derse → hızlı olan kısaltma değil, **kapsamı dar tutma**. Adım 1-10 yine geçer, kapsam 1 satır olabilir.

## Hibrid Uygunluk Kontrolü — Kategorik Cevap Tablosu

| Senaryo | Kategori | Akış |
|---|---|---|
| 1 satır typo bir dosyada | Taktiksel (skill dışı) | Doğrudan yap, raporla |
| 1 fonksiyonun bug'ı, tek dosya | Stratejik | 10 adım, standart döngü |
| 2-3 dosyada bağlantılı fix | Stratejik (sınırda) | 10 adım + Adım 1'de scope onayı |
| 3+ dosya, mimari etkili | **Kritik** | `bella-onay-gateway` her adımda + scope tartışması |
| .env veya secret değişikliği | **Kritik** | DUR, `vault-okuma-protokol` skill'ini tetikle, yapma |
| DB migration | **Kritik** | DUR, ayrı plan, geri alma stratejisi şart |
| External API key dönüşü | **Kritik** | Bitwarden + Vercel + Gökhan onayı |

## Bella-Özel Bağlam

- **Repo:** `D:/GAI/repos/bella/`
- **Branch model:** `BD<N>` veya `BD<N>-B<X>` veya `fix-<konu>`
- **Tag:** `v<M.m+1>-<konu>` (her bug fix sonrası MINOR +1)
- **Dev server:** `npm run dev` (localhost:3000 default)
- **Smoke test endpoints:** `bella-dev-smoke-test` skill'inde detay
- **Detay kural:** vault `operasyon/kurallar/git-akisi.md` + `hata-politikasi.md`

## İlgili Skill'ler

- `bella-onay-gateway` — kritik aksiyonlar (push, merge, tag, env)
- `bella-dev-smoke-test` — fix sonrası doğrulama (Adım 7)
- `vault-hl-kayit` — anlamlı+ hata log'u (Adım 9)
- `state-reconcile-evrensel` — kapsam belirsizse Adım 2 öncesi
- `bella-bd-turu-acilis` — yeni BD turu (bu skill bug fix için, BD açılışı için değil)
