---
name: bella-onay-gateway
description: Use BEFORE executing ANY critical or strategic action in Bella context — git push, vercel deploy, master merge, git tag, branch delete, env variable change, file delete, package install, 3+ file refactor, dependency upgrade, DNS change, Airtable bulk operation, secret rotation, or anything else on the vault delegation-detay.md kritik liste. This skill is the discipline gate that stops the "commit+push tek nefeste" anti-pattern (push protokol ihlali 2026-04-28). MUST invoke even if user already approved the parent task — every critical action gets its own explicit "onaylıyorum". "Yap" alone is NOT approval. Use this skill aggressively — over-triggering is fine, under-triggering causes shipped regressions.
---

# Bella Onay Kapısı

## Amaç

Kritik veya Stratejik bir aksiyon yapılmadan **önce** dur. Kategoriyi hatırlat, Gökhan'dan açık "onaylıyorum" ifadesini bekle. "Yap" yetmez. Önceki onay yetmez. Bu skill geçilmedikçe kritik komut çalıştırma.

**Neden:** Hata-logu 2026-04-28 pattern: "Antigravity push protokolü — `3128dc6` ve amended `f3af3b7` commit'leri açık onay öncesi push edildi (Vercel preview URL'leri canlı geldi). 2 tekrar = pattern." Push komutu commit ile aynı nefeste çalıştırıldığında preview URL otomatik üretiliyor, Gökhan önizleme şansını kaybediyor. Bu pattern her kritik aksiyon için var — atomik bir disiplin gerek.

## Kuralın Özü

> **"Yap" yetmez. Açık "onaylıyorum" şart. Aynı oturumda zaten onaylanmış kritik aksiyon **yeniden** onay ister. Onay yorgunluğu kabul, yanlış aksiyon sıfır.**

## Tetikleyici — Kritik Aksiyon Listesi

Aşağıdaki aksiyonlardan birine geçmeden ÖNCE bu skill tetiklenir. (Detay: vault `operasyon/kurallar/delegation-detay.md`)

### Git / Versiyonlama
- `git push` (her branch — feature, BD, master, fix)
- `git push --force` (her zaman + force-with-lease tercih)
- `git tag -a` / `git push origin <tag>`
- `git merge` master'a (her merge)
- `git branch -d` / `-D` (silme)
- `git push origin --delete <branch>` (remote branch silme)
- `git reset --hard` (her zaman)
- `git rebase` (interactive değil ama yine de scope büyük)

### Deploy / Vercel
- `vercel --prod` / `vercel deploy` / `vercel inspect`
- Vercel CLI'nin **herhangi bir** deploy komutu
- Vercel dashboard'dan env değişikliği (kullanıcı yapsa bile skill hatırlatır)
- DNS kaydı (Cloudflare veya başka)

### Dış Servis
- Airtable: base/table/field ekleme, silme, bulk UPDATE/DELETE
- Clerk: organization/user ayarları
- Twilio: numara, sender ID, mesaj template
- cron-job.org: schedule değişikliği
- Anthropic / Google Calendar / Airtable API key rotasyonu

### Secret / Env / Auth
- `.env*` dosya değişikliği (Bella + landing)
- Vercel env variable add/edit/delete
- Bitwarden: yeni secret ekleme/silme
- Cookie/session config değişikliği

### Dosya Sistemi
- Dosya/klasör **silme** (rename değil — silme)
- `.gitignore` değişikliği (yanlış eklenme = secret leak riski)
- 3+ dosyaya yayılan refactor

### Bağımlılık / Sistem
- `npm install <yeni paket>` / `yarn add` (yeni dependency)
- `package.json` scripts değişikliği
- `next.config.js`, `tsconfig.json`, `tailwind.config.js`
- Node/npm version upgrade

### Vault
- `raw/` altındaki **herhangi bir** dosya değişiklik veya silme (raw/ append-only)
- `operasyon/kurallar/` değişikliği
- Vault `CLAUDE.md` değişikliği
- Klasör yapısı değişiklik

### Kod Tabanı
- Mimari pattern değişikliği (REST→GraphQL, vb.)
- DI / state management seçimi
- "Bu daha iyi olur" tipi istenmeyen refactor başlatma
- 3+ dosya değişikliği (scope büyüyor)

## Tetikleyici DEĞİL — Taktiksel

Aşağıdakiler **Taktiksel** kategori. Bu skill tetiklenmez, doğrudan yap + raporla:

- Tek dosyada CSS rengi/spacing
- Değişken adı düzeltme (rename, scope tek dosya)
- Markdown formatting (tire, başlık seviyesi)
- Comment ekleme/düzeltme
- Typo
- Local dev server başlatma/durdurma
- `git status`, `git log`, `git diff` (read-only komutlar)

Şüphe varsa → **Stratejik say**, bu skill'i tetikle.

## Akış

### Adım 1: Kategori Tespit Et

Aksiyonu üç kategoriden birine yerleştir:

| Kategori | Tepki | Örnek |
|---|---|---|
| **Taktiksel** | Yap, sonra raporla (skill kapanır) | CSS rengi, değişken adı |
| **Stratejik** | Plan sun + onay + yap | Kütüphane seçimi, fiyat, ton |
| **Kritik** | **Bu skill** tam akış (Adım 2+) | Push, deploy, env, silme |

Şüphedeysen üst kategori (Taktiksel mi Stratejik mi belirsiz → Stratejik; Stratejik mi Kritik mi belirsiz → Kritik).

### Adım 2: Pre-Aksiyon Raporu Sun

Komutu çalıştırmadan ÖNCE bu rapor sun (push örneği — diğer aksiyonlar için uyarla):

```markdown
## Onay Gerekiyor — [Kritik Aksiyon Adı]

### Kategori
**Kritik** — [hangi alt kategori: git push / vercel deploy / env / vb.]

### Komut(lar)
```
<gerçek komut, kopyala-yapıştır hale gelmiş>
```

### Etki
- **Ne değişecek:** [özet, 1-2 cümle]
- **Geri alınabilir mi?** [evet, nasıl / hayır, neden]
- **Görünür mü?** [Vercel preview, master canlı, public commit, vb.]

### Bağlam (push için)
- Commit hash: `<short>`
- Commit mesajı: `<mesaj>`
- Diff stat: `<git diff --stat HEAD~1>`
- İskelet özeti (~15-20 satır): [yapı görünür şekilde]

### Geri Alma Stratejisi
- [Eğer push yanlışsa: revert? force-with-lease?]
- [Eğer env yanlışsa: eski değer ne?]

### Beklenen İfade
"Onaylıyorum" / "evet, push et" / "yap, onay" gibi **açık** ifade.
"Yap" tek başına yetmez.
```

### Adım 3: Açık Onay Bekle

Gökhan açık ifade verdi mi:
- ✅ "Onaylıyorum" / "evet, push et" / "yap, onay" / "tamam push" → Adım 4
- ❌ "Yap" tek başına → **Yine sor.** "Açık onay rica ediyorum — bu kritik aksiyon."
- ❌ "Evet" sadece bir cümlede başka konu ortasında → **Yine sor.** Bağlamı net olmalı.
- ❌ "Önceden onayladım" / "geçen turda dedim" → **Yine sor.** Her kritik aksiyon ayrı onay.
- ❌ Gökhan sessiz → **Yine sor.** Sessizlik onay değil.

### Adım 4: Çalıştır

Onay alındı — komutu **birebir** çalıştır (rapordaki komut nasılsa). Komutu değiştirme, "iyileştirme" katma.

### Adım 5: Post-Aksiyon Rapor

Komut çıktısını + sonucu raporla. Push örneği:

```markdown
✅ Push tamamlandı:
- `<branch>` → `origin/<branch>`
- Vercel preview URL: <eğer geldi>
- Exit code: 0
```

Hata varsa:

```markdown
🔴 Push başarısız:
- Exit code: <kod>
- Hata: <mesaj>
- Önerim: <bir sonraki adım, plan>
```

## Anti-Rationalization Tablosu

Bu tablodaki düşünceler **STOP** sinyali. Onay almadan ilerleme.

| Düşünce | Gerçek |
|---|---|
| "Gökhan zaten plana onay verdi, push da plan'ın parçası" | Plan onayı ≠ push onayı. Her kritik aksiyon ayrı. |
| "Sadece feature branch'e push, master'a değil" | Feature branch push da kritik (vault delegation-detay §Deploy). |
| "Sadece tag attım, push değil" | Tag oluşturma kritik kategori (vault kuralı). |
| "Bu commit küçük, push otomatik gitsin" | Küçük olması kritik kategoriyi değiştirmez. |
| "Geri alınabilir, force-with-lease var" | Geri alınabilirlik onay gereksinimini kaldırmaz. |
| "Aynı şeyi 5 dakika önce onayladı" | Her aksiyon ayrı onay. Onay yorgunluğu kabul. |
| "Komut zaten clipboard'da, sadece çalıştırıyorum" | Hala çalıştırma noktasında onay gerek. |
| "Antigravity / başka agent zaten push edecekti" | Sen kullandıysan sen sorumlusun. |
| "Hızlı olmak için onay sormayacağım" | Yanlış push'un düzeltmesi her zaman daha yavaş. |
| "Onay verdi ama 'şeyi' demedi, ben yorumluyorum" | Yorumlama yok. Açık ifade yoksa yine sor. |
| "Gökhan oturumda yok, sonra raporlarım" | Gökhan yoksa kritik aksiyon **yok**. Bekle. |

## Red Flag Cümleleri — STOP

Şu cümleleri yazıyorsan veya düşünüyorsan dur, Adım 3'e dön:

- "Onaylanmıştı, yine sormaya gerek yok"
- "Hızlıca push edeyim"
- "Bu sefer ufak, onaysız geçelim"
- "Commit + push tek nefeste"
- "Gökhan dedi ki 'yap' yani onay"
- "Sanırım demek istediği..."
- "Otomatik olarak..."
- "Skip onayı"
- "Onay alındı sayalım"

**Hepsi:** Komutu çalıştırma. Adım 3'te kal.

## Sınır Vakaları

### "Komut zaten çalıştı, geri al"
Yanlışlıkla push edildiyse (skill atlandı):
1. DUR, başka komut çalıştırma
2. HEMEN Gökhan'a bildir
3. Hata-logu'na pattern olarak yaz (`vault-hl-kayit`)
4. Geri alma stratejisini birlikte belirle (revert vs force-with-lease vs kabul)

### Toplu kritik aksiyon (batch)
Birden fazla kritik aksiyon ardışık (örn. 9 branch sil + 9 remote sil):
- Tek bir batch onay alınabilir mi? → **Evet**, ama batch içeriği açıkça listelenmeli ("9 branch: X, Y, Z, ...")
- Her batch ayrı onay → onay yorgunluğu kabul ama disiplin korunur
- Vault hata-logu 2026-05-06 pattern: "Atomik branch cleanup pattern doğrulandı" — tek komut 9 branch OK çünkü `--merged master` kriteri güvenli

### Gökhan "her şeye otomatik onay" derse
Mentor rolü direktifi (`feedback_mentor_rolu.md`) "stratejik için autopilot" der. **Stratejik ≠ Kritik.** Kritik için autopilot YOK. "Otomatik onayla" denirse: "Stratejik için autopilot OK. Kritik için her birini yine soracağım — vault kuralı, mentor rolü override etmiyor."

### Bu skill'i atlamak
Bu skill'i atlamak başlı başına Kritik hata. Atladıysam:
1. DUR
2. HL kaydı zorunlu
3. Sonraki pattern incelemesinde delegation-detay'a yeni madde

## Bella-Özel Bağlam

- **Repo:** `D:/GAI/repos/bella/`
- **Production:** `<bella-vercel-proje>.vercel.app` (master branch)
- **Vercel CLI:** Bella CLAUDE.md'de yasak — sadece dashboard + GitHub push
- **Detay liste:** vault `operasyon/kurallar/delegation-detay.md` (her ay büyüyen liste)

## İlgili Skill'ler

- `bella-bug-fix-cycle` — Adım 6 (push onayı) ve Adım 8 (merge+tag) bu skill'i çağırır
- `bella-bd-turu-acilis` — anchor tag öneri bu skill ile uygulanır
- `bella-handoff-yazimi` — push protokol ihlali kontrolü için
- `vault-hl-kayit` — bu skill atlanmışsa HL kaydı şart
- `vault-okuma-protokol` — vault raw/ değişiklikleri için tetiklenmesi gereken safety
