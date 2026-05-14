# Developer Skill: Anthropic Prompt Caching & Cost Optimizer

## Amacı
Claude AI API maliyetlerini optimize eder. Projeye yeni yetenekler ve tool'lar eklendikçe artacak olan token (kredi) sarfiyatını, Anthropic'in prompt caching mekanizmalarını doğru kullanarak minimize eder.

## Kullanım Kuralları
1. `app/api/chat/route.ts` içinde Anthropic mesajları oluştururken, büyük sistem promptlarına ve tool tanımlarına `cache_control: {"type": "ephemeral"}` bayrağını eklemeyi unutma.
2. Caching sisteminin verimli çalışabilmesi için tool tanımlarını ve statik metinleri mesaj bloğunun en başına yerleştir.
3. LLM API'sine gereksiz context (çok eski sohbet geçmişi veya alakasız veritabanı kayıtları) göndermekten kaçın. Bağlam penceresini (context window) temiz ve amacına uygun tut.

## Öncelik Seviyesi
Temel (9/9) - Sistem scale olduğunda (büyüdüğünde) faturaların sürdürülebilir seviyelerde kalmasını sağlar.
