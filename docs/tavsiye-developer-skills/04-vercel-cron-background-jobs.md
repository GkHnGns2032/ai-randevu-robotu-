# Developer Skill: Vercel Cron & Background Jobs Architect

## Amacı
Arka planda çalışacak olan "Personel Brifing", "No-Show Önleyici" ve "Retargeting" özellikleri için, asenkron ve zamanlanmış görevlerin Vercel ortamında limitlere takılmadan nasıl yönetileceğini belirler.

## Kullanım Kuralları
1. Proje Vercel Hobby planında yayınlandığı için Vercel cron.json limitlerine (günde 1) dikkat et.
2. Zamanlanmış görevler (background jobs) dış servisler (örn: cron-job.org) tarafından tetiklenen `/api/...` endpoint'leri olarak tasarlanmalıdır.
3. Bu endpoint'ler yetkisiz tetiklemelere karşı mutlaka bir `CRON_SECRET` environment variable'ı ile doğrulanmalı ve korunmalıdır.
4. Arka plan işlemlerinde (SMS atma, veri güncelleme) yaşanacak bir hatanın diğer müşterilerin işlemlerini durdurmasını engellemek için `Promise.allSettled()` gibi güvenli asenkron yapıları kullan.

## Öncelik Seviyesi
Yüksek (4/9) - Otonom işlemlerin sağlıklı ve güvenli bir şekilde arka planda akmasını sağlar.
