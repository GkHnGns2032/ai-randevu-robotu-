---
name: bella-bd-turu-acilis
description: Use when Gökhan starts a new Bella Backlog-Driven (BD) round — phrases like "BD3 başlatıyorum", "BD3-B4 ile başlayalım", "BD-UI-2 açalım", "yeni tur açıyoruz", "BDX turu", "tur açalım Bella'da", or any message naming a BD-prefixed identifier in Bella context. Triggers when starting any code-modifying round in repos/bella/. Reconciles handoff claims against git reality before any work begins (memory drift is 35% — handoff is never trusted alone). Produces a STATE-RECONCILE report and proposes the round plan for explicit approval. Always invoke this skill when a Bella round opens — do not start coding directly.
---

# Bella BD Turu Açılışı

## Amaç

Yeni bir BD (Backlog-Driven) turu Bella'da açıldığında, **handoff iddialarına güvenmeden** git gerçekliğini doğrula, açık loop'ları sınıflandır, anchor tag + branch + ilk 2-3 adımı içeren tur planını sun, açık onay bekle.

**Neden:** Memory drift %35 (hata-logu 2026Q2 pattern özeti). Handoff "main clean" der ama 3 untracked vardır; "asama-3 5 commit" der gerçekte 8'dir. Körü körüne handoff'a güvenip plana geçmek pattern'in tekrarıdır.

## Tetikleyici Cümleler

- "BD3 başlatıyorum" / "BD3-B4 başlayalım"
- "BD-UI-2 açalım" / "yeni tur"
- "STATE-RECONCILE-N" (sadece keşif turu — kod yazımı yok)
- BD-prefix'li herhangi bir tur adı geçtiğinde, Bella context'inde

## Tetikleyici DEĞİL

- Tek satır bug fix talebi ("şu typo'yu düzelt") — bu `bella-bug-fix-cycle` hibrit kontrolüne girer
- Vault iş'i — bu vault skill'lerine girer
- Landing iş'i — Bella değil

## Çıktı: STATE-RECONCILE Raporu

Aşağıdaki şablonu **tam olarak** üret (markdown). Boş bırakma, "doğrulanamadı" yaz.

```markdown
## STATE-RECONCILE — [tur adı, örn. BD3-B4]

### 1. Git Gerçeği
- **Branch:** `<git branch --show-current>`
- **Master uzaklığı:** `<git rev-list --count master..HEAD>` ahead / `<...HEAD..master>` behind
- **HEAD:** `<son commit kısa hash + mesaj>`
- **Son 6 commit:** `<git log --oneline -6>`
- **Tag'ler (son 8):** `<git tag --sort=-creatordate | head -8>`
- **Untracked / dirty:** `<git status --short>` (boşsa "temiz")
- **Remote sync:** ahead/behind origin durumu

### 2. Handoff İddiası vs Git Gerçeği

Aktif handoff entry'sini (`memory/project_aktif_oturum_handoff.md` veya benzeri) git state ile karşılaştır:

| Handoff'taki iddia | Git'teki gerçek | Durum |
|---|---|---|
| (örn. "main clean") | (örn. 3 untracked) | 🔴 drift |
| (örn. "v1.6-b3 push edildi") | (`git tag -l v1.6-b3` çıktısı) | 🟢 doğrulandı |

### 3. Açık Loop'lar (sınıflandırılmış)

- 🟢 **Doğrulanmış:** ... (handoff'ta var + git'te onaylandı, doğrudan plana alınabilir)
- 🟡 **Doğrulama gerek:** ... (handoff'ta var ama git'le çapraz kontrol yapılmadı — mini keşif şart)
- 🔴 **Drift suspect:** ... (handoff iddiası git ile uyumsuz — keşif turu zorunlu)

### 4. Önerilen Tur Planı

- **Tur adı:** `BD<N>-<konu>` veya `BD<N>-B<sub>`
- **Anchor tag (öncesi):** `v<M.m>-<konu>-baseline` (öneri)
- **Branch adı:** `<isimlendirme kuralı: küçük, tire, TR yok, boşluk yok>`
- **Kapsam:** [hangi dosyalar/modüller dokunulacak — tahmini]
- **İlk 3 adım:**
  1. ...
  2. ...
  3. ...
- **Beklenen kapanış tag'i:** `v<M.m+1>-<konu>` (tur sonu)

### 5. Beklenen Onay
- Tur planı OK mi?
- Anchor tag adı / branch adı düzeltme var mı?
- Eğer 🔴 drift varsa → keşif turunu önce mi açalım?
```

## Davranış Kuralları

### Komutları çalıştır, varsayma
Rapordaki her sayı ve liste **gerçek `git` komutu** çıktısından gelir. "Muhtemelen X commit" yazma — `git rev-list --count` çalıştır, gerçek sayıyı yaz.

### Handoff'a sadece pointer olarak güven
Handoff "BD3-B3 tamam" diyorsa, `git log --grep='BD3-B3'` veya `git tag -l "*b3*"` ile doğrula. Doğrulanmadıysa 🟡 işaretle.

### Anchor tag öner, kullanıcı atar (kritik aksiyon)
Anchor tag ÖNER (isim + zaman). Tag oluşturma KRİTİK kategori — açık onay alınmadan `git tag` çalıştırma. Bkz: `bella-onay-gateway`.

### Drift varsa keşif turu önceliği
🔴 drift suspect loop varsa, **plana değil keşif turuna** yönlendir. Plan: "Bu loop için 1 saatlik STATE-RECONCILE turu açalım, kod dokunulmaz, doğrula sonra ana planı tazeleyelim."

### claude.ai çıktı kabul etme
Eğer handoff `claude.ai` tarafından yazılmışsa (vault `CLAUDE.md` §9.1: handoff yazımı yasak), o handoff'a güvenme — git state'i tek doğru kabul et, raporu **yeni baştan** kur.

## Bella-Özel Bağlam

- **Repo:** `D:/GAI/repos/bella/` (Bella AI Randevu Robotu)
- **Branch model:** master = canlı (her zaman temiz), feature branch'ler `BD<N>` veya `fix-konu`
- **Tag konvansiyonu:** `v<MAJOR>.<MINOR>-<konu>` (Bella production seviyesi)
- **Anchor tag pattern:** her tur öncesi+sonrası
- **Detay kural:** vault `operasyon/kurallar/git-akisi.md`

## Yaygın Hata Pattern'leri (Bunlardan Kaçın)

| Pattern | Neden kötü | Doğrusu |
|---|---|---|
| Rapora "handoff'a göre 5 commit var" yazmak | Handoff drift'i kaçırır | `git log --oneline` çalıştır, gerçek sayıyı yaz |
| Anchor tag'i otomatik atmak | KRİTİK kategori, açık onay şart | Öner, onay sonrası `bella-onay-gateway` kullan |
| Plan adımlarını handoff'tan kopyalamak | Kapsam genişlemiş olabilir | İlk 3 adımı **kendin** keşfet, dosyaları aç, gerçek state'e bak |
| 🟡 loop'u 🟢 göstermek (iyimserlik) | Memory drift'in 2 numaralı sebebi | Şüphedeysen 🟡, kanıt yoksa 🔴 |

## İlgili Skill'ler

- `bella-onay-gateway` — tag atma, push, merge gibi kritik aksiyonlar için
- `state-reconcile-evrensel` — sadece keşif turu (kod yazımı yok)
- `bella-handoff-yazimi` — tur kapanışında, bu açılışın simetrik karşılığı
