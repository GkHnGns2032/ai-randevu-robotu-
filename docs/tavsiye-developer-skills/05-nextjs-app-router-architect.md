# Developer Skill: Next.js 15 App Router Architect

## Amacı
Next.js 15'in modern mimarisini korumak, Server Components ve Client Components arasındaki çizgiyi doğru çekmek ve projede performanslı, SEO dostu kod yazılmasını sağlamak.

## Kullanım Kuralları
1. Varsayılan olarak her componenti Server Component (RSC) olarak yaz. Sadece state (`useState`), effect (`useEffect`) veya browser API'leri (onClick, vb.) gerektiren componentlerin en üstüne `"use client";` direktifi ekle.
2. Veri çekme (Data Fetching) işlemlerini mümkün olduğunca sunucu tarafında (Server Components veya Server Actions) yap, böylece istemci tarafında ekstra yük oluşturma.
3. API route'larını `app/api/.../route.ts` standartlarına uygun yaz. Request/Response objelerinde Next.js 15 standartlarına uy.

## Öncelik Seviyesi
Orta-Yüksek (5/9) - Projenin temel iskeletinin modern ve performanslı kalmasını sağlar.
