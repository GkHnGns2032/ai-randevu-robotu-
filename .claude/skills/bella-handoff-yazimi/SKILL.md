---
name: bella-handoff-yazimi
description: Use when Gökhan closes a Bella round or session — phrases like "tur bitti", "kapatalım", "günü kapatıyorum", "handoff yaz", "şu turun handoff'u", "sonraki tura geçmeden özetle", "bugün burada bırakalım". Triggers at the end of any Bella work session that produced commits or decisions worth carrying forward. Produces three artifacts: (1) memory/project_aktif_oturum_handoff.md overwrite for next-session pickup, (2) vault/operasyon/retro/gunluk.md append for daily log, (3) optional HL entries flagged for vault-hl-kayit. Always use this skill — never let Gökhan close without a written handoff (claude.ai cannot write handoffs per vault rule §9.1).
---

# Bella Tur Kapanış Handoff'u

## Amaç

Bir Bella oturumu / BD turu kapanırken, **bir sonraki oturum açıldığında "nerede kalmıştık" sorusunu sıfır soruyla cevaplayacak** üç çıktı üret. Memory'deki aktif handoff entry'sini overwrite et (geçici, oturum bazlı), vault günlük log'una 1 satır ekle (append-only kalıcı), anlamlı+ hatalar için HL aday listesi çıkar.

**Neden:** Vault CLAUDE.md §9.1: handoff yazımı Claude Code'a aittir, claude.ai yazamaz. Hata-logu 2026-05-04 ve 2026-05-05'te "handoff güncellik kayması" pattern'i 2 kez — handoff yoksa veya stale ise sonraki oturum drift'le başlar. Yapısal disiplin gerek.

## Tetikleyici Cümleler

- "Tur bitti" / "BD3-B4 kapanış"
- "Kapatalım" / "günü kapatıyorum" / "bugün burada bırakalım"
- "Handoff yaz" / "şu turun handoff'u"
- "Sonraki tura geçmeden özetle"
- Bir BD turu master'a merge + tag push'landıktan sonra (otomatik tetikle)

## Tetikleyici DEĞİL

- Tek mesaj soru/cevap — handoff gerekmez
- Hiç commit/karar olmadan kapanış — "bugün hiçbir şey yapılmadı" kaydı yeter
- Vault iş'i kapanışı — bu skill Bella için (ama dosyaların 2'si vault'a yazılır)
- claude.ai oturumu — bu skill claude.ai'de tetiklenmez, Claude Code'a aittir

## Çıktı 1/3 — Aktif Oturum Handoff (memory)

**Dosya:** `D:/GAI/memory/project_aktif_oturum_handoff.md`

**Eylem:** Mevcut entry'yi **overwrite** et (geçici entry, sonraki turda silinir/güncellenir). MEMORY.md index satırı da güncelle.

**Şablon:**

```markdown
---
name: Aktif oturum handoff ([YYYY-MM-DD] → devam)
description: [Bu oturumun ne yaptığını + sıradakini 1 satırla özetle]
type: project
---

**Bu entry geçici — sonraki tur açıldığında silinecek/güncellenecek.**

## Bu oturumda ([YYYY-MM-DD]) tamamlanan

| Aşama | Çıktı | Anchor / commit |
|---|---|---|
| [BD3-B4 fix] | [localStorage chat history kurtarıldı] | commit `<hash>` + tag `v1.7-bd3-b4` push'lı |

(Her satır git'ten doğrulanmış — `git log --oneline` ve `git tag -l` çıktılarını çapraz kontrol et)

## Pending push (varsa)

| Branch/tag | İçerik | Onay durumu |
|---|---|---|
| `BD3-B5` | 2 commit, master'a merge bekliyor | Açık onay alınmadı |

Yoksa: "**Pending push — yok**. Tüm commit'ler GitHub'da senkron."

## Açık loop'lar (sınıflandırılmış)

- 🟢 **Doğrulanmış:** [item — kaynak: commit/tag/dosya referansı]
- 🟡 **Doğrulama gerek:** [item — neyin doğrulanması gerekiyor]
- 🔴 **Drift suspect:** [item — kaynak belirsiz, sonraki oturumda direkt keşif]

## Sırada — Sonraki Tur Pickup

1. [İlk aksiyon — kanıt-bazlı, "muhtemelen" yok]
2. [İkinci aksiyon]
3. [Üçüncü aksiyon — opsiyonel]

## Geri kalan minor cleanups (turla doğrudan ilgisiz)

- [item 1]
- [item 2]

## Yeni oturumda pickup checklist

1. MEMORY.md + 23+ entry otomatik yüklenir
2. `bella-bd-turu-acilis` skill'i otomatik tetiklenir (eğer Gökhan BD<N> der demez)
3. İlk aksiyon: yukarıdaki "Sırada" maddesi #1

## Genel kurallar — hatırlatma

- Push KRİTİK — açık onay (bella-onay-gateway)
- Atomik commit — bir iş = bir commit
- claude.ai handoff yazmaz (vault CLAUDE.md §9.1)
```

## Çıktı 2/3 — Günlük Log (vault)

**Dosya:** `D:/GAI/vault/operasyon/retro/gunluk.md`

**Eylem:** **Append** (silme yok, eski kayıtlar dokunulmaz). Tarih bölümü yoksa yarat.

**Şablon:**

```markdown
## [YYYY-MM-DD]
- [Ne öğrendim / ne fark ettim / ne denedim — 1-3 cümle, somut]
- [Tur/BD adı + sonuç: ✅ tamamlandı / 🟡 yarım / 🔴 keşif gerekti]

**Yarın ilk iş:** [Tek cümle, en kritik aksiyon]
```

**Örnek (gerçek):**

```markdown
## 2026-05-14
- M9 workspace migration tamamlandı, 4 dağınık kök D:/GAI/'ye birleşti. Vault private repo (gunesai-vault). Faz A + B0 + B1 tamam, B2 başlangıç.
- Bella main clean, 3 untracked doc dosyası bekliyor (BD-AGENT-SKILL-ONERILERI + tavsiye-developer-skilller/).

**Yarın ilk iş:** B2 — 9 Bella+vault skill yazımı, ilk skill bella-bd-turu-acilis.
```

## Çıktı 3/3 — HL Aday Listesi (opsiyonel)

Eğer turda **anlamlı veya kritik hata** çıktıysa, HL kayıt adayları listele. Listeyi `vault-hl-kayit` skill'i alır.

```markdown
## Hata-logu adayları (vault-hl-kayit ile yazılacak)

- **[YYYY-MM-DD]** — [konu] — [ne olmuştu, kanıt] — [nasıl düzeldi, pattern]
- [...]
```

Hata yoksa: "**HL kayıt yok** — bu turda anlamlı/kritik hata gözlemlenmedi."

**Kategori karar (vault `hata-politikasi.md`):**
- Küçük/etkisiz → kayıt **gerekmez** (typo, format)
- Anlamlı → kayıt **zorunlu** (yanlış mantık, yanlış dosya)
- Kritik → kayıt + kritik liste güncelleme önerisi

## Davranış Kuralları

### Git state'i komut çalıştır, varsayma
Tüm sayılar, hash'ler, tag'ler **gerçek `git` komutu** çıktısından. Memory'deki son handoff'ta "5 commit" yazıyor olabilir — sen `git log --oneline <baseline>..HEAD` çalıştır, gerçek sayıyı yaz.

**Standart komut seti:**
```bash
git status --short
git log --oneline <baseline-tag>..HEAD
git tag --sort=-creatordate | head -10
git rev-list --count master..HEAD
git rev-list --count HEAD..origin/master  # ahead/behind
```

### Açık loop sınıflandırma zorunlu
Her açık loop 🟢/🟡/🔴 işaretsiz olamaz. "Sınıflandıramadım" → otomatik 🔴 (en güvenli, sonraki oturumda keşif tetikler).

### claude.ai handoff yazmaz
Vault CLAUDE.md §9.1 + `delegation-detay.md`. Eğer kullanıcı "claude.ai'ye yazdırayım" derse → "Bu skill Claude Code'a ait, ben yazıyorum, claude.ai sadece brainstorm rolünde."

### Push protokol ihlali kontrolü
Handoff yazılırken, son turdaki push'ları doğrula: her push öncesi açık onay alındı mı? Alınmadıysa pattern olarak HL aday listesine ekle (`feedback_push_protokol_ihlali.md` referansı).

### Memory drift kontrolü — son cross-check
Handoff yazımı bittiğinde, son adım:
```bash
git log --oneline -3
git status
```
Çıktıyı yazılan handoff'la **göz** karşılaştır. Tutarsızlık varsa düzelt, sonra dur.

### Tarih: sistem tarihinden
`Today's date` context'ten al (system reminder'da var). Tarihi tahmin etme.

## Akış Özeti

1. Git state komutları çalıştır → kanıt topla
2. Çıktı 1 (memory aktif handoff) overwrite — şablonu doldur, MEMORY.md index satırını güncelle
3. Çıktı 2 (vault günlük log) append
4. Çıktı 3 (HL aday listesi) — anlamlı+ hata varsa
5. Cross-check: son `git log --oneline -3` + `git status` ile yazılanı doğrula
6. Gökhan'a sun: "3 dosya güncellendi: [path'ler]. HL kayıt adayı [var/yok]."
7. Vault dosyaları **commit edilmez** burada — `vault-hl-kayit` ve haftalık retro commit'leri bu işi yapar

## Yaygın Hata Pattern'leri

| Pattern | Neden kötü | Doğrusu |
|---|---|---|
| "Muhtemelen v1.6 tag'i atıldı" | Handoff drift — sonraki oturum güvenir | `git tag -l "v1.6*"` çalıştır, gerçek listeyi yaz |
| 🟡 loop'u 🟢 göstermek | Sonraki oturum mini keşfi atlar | Şüphedeysen 🟡, kanıt yoksa 🔴 |
| "Pending push yok" demek ama branch local'de kaldıysa | Sonraki oturum eksik state'le açılır | `git branch -vv` çalıştır, ahead/behind kontrol |
| Handoff'u sadece memory'ye yazıp gunluk.md'yi atlamak | Haftalık retro'da iz kalmaz | Her iki dosya zorunlu |
| Aktif handoff entry'sini append etmek (overwrite yerine) | Entry büyür, sonraki oturum konfüze olur | Overwrite — geçici entry |

## İlgili Skill'ler

- `bella-bd-turu-acilis` — simetrik karşılığı, oturum açılışı
- `vault-hl-kayit` — HL aday listesini gerçek log kaydına dönüştürür
- `memory-entry-yazimi` — aktif handoff entry'si memory entry yazımı kurallarına uyar
- `bella-onay-gateway` — push protokol ihlali kontrolü için
