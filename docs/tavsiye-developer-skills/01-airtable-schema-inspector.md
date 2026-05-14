# Developer Skill: Airtable Schema Inspector & Veri Uzmanı

## Amacı
Bu skill, Antigravity/Claude Code'un projede Airtable veritabanı ile çalışırken halüsinasyon görmesini (olmayan sütunları veya yanlış veri tiplerini kullanmasını) engeller. Yeni özellikler (Örn: Retargeting, Analitik) geliştirirken veritabanı işlemlerinin kusursuz yazılmasını sağlar.

## Kullanım Kuralları
1. Projede `lib/airtable.ts`, `lib/staff.ts` ve `lib/customer-notes.ts` dosyaları Airtable operasyonlarının merkezidir. Yeni bir Airtable sorgusu yazarken daima bu dosyalardaki mevcut CRUD kalıplarını referans al.
2. Sütun isimleri büyük/küçük harfe duyarlıdır. Asla tahmini sütun ismi kullanma. Gerekirse kodu yazmadan önce mevcut base/schema'yı kontrol et.
3. Sorgularda her zaman filterByFormula kullanırken Airtable'ın özel formül sentaksına dikkat et.

## Öncelik Seviyesi
Kritik (1/9) - Veri katmanı her şeyin temelidir.
