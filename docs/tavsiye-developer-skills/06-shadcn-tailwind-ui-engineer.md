# Developer Skill: Shadcn & Tailwind UI Engineer

## Amacı
Yeni bir ekran (Örn: Veri analitiği sayfası, Müşteri Takip paneli) inşa ederken, standart dışı inline CSS yazımını engeller. Projenin premium tasarım sistemini ve UI/UX bütünlüğünü korur.

## Kullanım Kuralları
1. Yeni arayüz bileşenleri oluştururken, sıfırdan yazmak yerine öncelikle projedeki mevcut `components/ui` klasöründeki Shadcn component'lerini (Button, Card, Input vb.) kullan.
2. Stil vermek için `style={...}` yerine kesinlikle Tailwind CSS utility class'larını kullan. Projedeki `tailwind.config.ts` tasarım token'larını (renkler, fontlar) gözet.
3. İkonlar için daima `lucide-react` kütüphanesini kullan.
4. Tasarımların mobil uyumlu (responsive) olmasına dikkat et (`md:`, `lg:` prefixlerini aktif kullan).

## Öncelik Seviyesi
Orta (6/9) - Arayüzün profesyonel ve kurumsal güzellik merkezi imajını korumasını sağlar.
