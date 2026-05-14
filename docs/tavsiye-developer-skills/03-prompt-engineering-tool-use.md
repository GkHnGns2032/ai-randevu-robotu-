# Developer Skill: Prompt Engineering & AI Tool-Use Uzmanı

## Amacı
Bella'nın kendi zekasını (Anthropic SDK `messages.stream` ve tool-use mekanizması) güncellerken, yeni yeteneklerin (örneğin resim analiz aracı veya dinamik fiyat hesaplama aracı) mevcut chat akışını bozmadan modüler olarak nasıl ekleneceğini yönetir.

## Kullanım Kuralları
1. Yeni bir AI aracı (tool) ekleneceğinde, her zaman Anthropic Tool Use formatına (name, description, input_schema) tam uyumlu bir JSON şeması oluştur.
2. `app/api/chat/route.ts` içindeki chat döngüsünü bozma. Sadece yeni tool objesini tanımla ve ilgili handler fonksiyonunu yaz.
3. Prompt güncellemelerinde (System Prompt), Bella'nın Türkçe konuşma, kibar olma ve salon asistanı karakterini bozacak talimatlardan kaçın. Yeni yetenekleri system prompt'a net yönergeler (guidelines) halinde ekle.

## Öncelik Seviyesi
Yüksek (3/9) - Chatbotun yapay zeka çekirdeğinin ve otonom görevlerinin hatasız çalışmasını sağlar.
