"""Bella Skills PDF generator — Türkçe uyumlu."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether
)

pdfmetrics.registerFont(TTFont("Arial", "C:/Windows/Fonts/arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", "C:/Windows/Fonts/arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", "C:/Windows/Fonts/ariali.ttf"))
pdfmetrics.registerFontFamily(
    "Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic"
)

GOLD = HexColor("#B8860B")
DARK = HexColor("#2C2C2C")
SOFT = HexColor("#6B6B6B")
BG = HexColor("#FAF8F3")
BORDER = HexColor("#D4C89A")

styles = getSampleStyleSheet()
h1 = ParagraphStyle(
    "h1", parent=styles["Heading1"], fontName="Arial-Bold", fontSize=24,
    textColor=DARK, spaceAfter=12, leading=30
)
h2 = ParagraphStyle(
    "h2", parent=styles["Heading2"], fontName="Arial-Bold", fontSize=16,
    textColor=GOLD, spaceBefore=14, spaceAfter=8, leading=20
)
h3 = ParagraphStyle(
    "h3", parent=styles["Heading3"], fontName="Arial-Bold", fontSize=12,
    textColor=DARK, spaceBefore=8, spaceAfter=4, leading=16
)
body = ParagraphStyle(
    "body", parent=styles["BodyText"], fontName="Arial", fontSize=10.5,
    textColor=DARK, leading=15, spaceAfter=6, alignment=TA_LEFT
)
small = ParagraphStyle(
    "small", parent=body, fontSize=9, textColor=SOFT, leading=12
)
mono = ParagraphStyle(
    "mono", parent=body, fontName="Arial", fontSize=9, textColor=DARK,
    backColor=BG, leftIndent=10, rightIndent=10, leading=13
)
tagline = ParagraphStyle(
    "tagline", parent=body, fontName="Arial-Italic", textColor=SOFT,
    fontSize=11, leading=14, spaceAfter=10
)


def bullet(text):
    return Paragraph(f"• {text}", body)


def card_table(rows, col_widths=None):
    """2-sütun kart tablosu — sol: etiket, sağ: içerik."""
    t = Table(rows, colWidths=col_widths or [3.5 * cm, 13 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Arial"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD),
        ("FONTNAME", (0, 0), (0, -1), "Arial-Bold"),
        ("TEXTCOLOR", (1, 0), (1, -1), DARK),
        ("BACKGROUND", (0, 0), (-1, -1), BG),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    return t


# ===================== İÇERİK =====================

SKILLS = [
    {
        "name": "bella-task-start",
        "slogan": "Task'a başlamadan önce zemin hazırla — regresyon önle, doğru modeli seç",
        "problem": (
            "Yeni bir task'a dalıp kod yazmaya başlandığında kullanıcının beğendiği mevcut "
            "özellikler (banner ışık efekti, bugünkü tahmini kazanç, gold renkler) "
            "farkında olmadan bozulabiliyor. Ayrıca her task öncesi 'Sonnet mi Opus mu' "
            "kararı tekrar tekrar tartışılıyor."
        ),
        "what": [
            "Task açıklamasını anlar ve netleştirici tek bir soru sorabilir",
            "İlgili plan dokümanını (docs/superpowers/plans/*.md) okur",
            "Etkilenecek dosyaları proje yapısından tahmin eder ve Glob/Grep ile doğrular",
            "Her dosya için mevcut kritik davranışları not alır (regresyon baseline)",
            "Task'ın doğasına göre diğer skill'leri tetikler (örn bot dokunulacaksa ai-tool-sync)",
            "Model önerir — 3 boyutta değerlendirir: dosya sayısı, karar yoğunluğu, context bağımlılığı",
            "Kullanıcıdan onay bekler, onay gelmeden kod yazmaya başlamaz",
        ],
        "triggers": [
            '"X task başlayalım"',
            '"faz X task Y"',
            '"bunu implement et/ekle/düzelt/yaz"',
            '"şunu yap", "hadi başlayalım"',
            "Yeni bir özellik veya fix başlatıldığında",
        ],
        "value": (
            "Geçmişte sessizce kaybolan özelliklerin tekrar yaşanmaması, "
            "token maliyetinin doğru modelle optimize edilmesi."
        ),
    },
    {
        "name": "bella-regression-check",
        "slogan": "Task sonrası — 'ne kırılmış olabilir' sorusunu sistematik sor",
        "problem": (
            "Task bitince TypeScript geçiyor diye 'bitti' sanılıyor ama görsel regresyon "
            "(stil kayması) veya fonksiyonel regresyon (başka bir akış bozuldu) manuel "
            "kontrol edilmediği için sonraki task başladığında yakalanmış oluyor."
        ),
        "what": [
            "git diff --name-only HEAD ile değişen dosyaları tespit eder",
            "Her dosyayı import eden bağımlıları Grep tool'u ile bulur (Windows uyumlu)",
            "Risk tablosuyla her dosyanın kritiklik seviyesini belirler "
            "(KRITIK: lib/ai-tools.ts, app/api/chat/route.ts, lib/airtable.ts...)",
            "Task'a özel test skill'lerini zorunlu kılar "
            "(chat dosyaları değiştiyse → chat-smoke-test, date kodu → timezone-guard)",
            "Spesifik manuel test checklist üretir — 'hangi butona bas, ne görmeli'",
            "Tarihsel olarak sessizce bozulan özelliklerin hâlâ çalıştığını kontrol ettirir",
            "5+ dosya veya yeni component eklendiyse .next cache temizleme uyarısı verir",
            "Onay beklemeden sonraki task'a/deploy'a geçilmez",
        ],
        "triggers": [
            '"task bitti", "implement ettim", "done"',
            '"hazır", "tamamlandı", "kontrol et"',
            "Commit öncesi, faz/task geçişlerinde, deploy öncesi",
        ],
        "value": (
            "Gizli bugların birikmesini engeller, kullanıcının fark etmeden bozulan "
            "özellikleri gözlemleme sorumluluğunu sistematize eder."
        ),
    },
    {
        "name": "bella-deploy",
        "slogan": "Deploy ceremony — 7 adımlı disiplinli prod çıkış",
        "problem": (
            "Manuel deploy (npx vercel --prod) yapılırken sıkça atlanıyor: "
            "TypeScript check, onay (kullanıcının hassas kuralı), cache uyarısı, "
            "post-deploy sağlık kontrolü. Sonra canlıda bir şey patlıyor ve "
            "ne zaman bozulduğu belli olmuyor."
        ),
        "what": [
            "npx tsc --noEmit çalıştırır — hata varsa deploy etmez",
            "git status + son 5 commit'i gösterir — uncommitted varsa sorar",
            "Deploy özeti çıkarır: canlıya çıkacak commit'ler, değişen dosya sayısı, risk seviyesi",
            "Kullanıcıdan AKTIF onay ister (pasif memory kuralı yerine skill enforcement)",
            "npx vercel --prod çalıştırır ve dpl_ hash'ini kaydeder",
            "Eğer 5+ dosya değiştiyse cache temizleme komutunu hatırlatır",
            "Post-deploy smoke test: dashboard URL'i, chat erişimi, cron endpoint ping",
        ],
        "triggers": [
            '"deploy edelim", "canlıya al"',
            '"vercel prod", "production\'a at"',
            '"yayınla", "npx vercel --prod"',
        ],
        "value": (
            "Deploy sonrası 'canlıda X patlamış' sürprizlerini en aza indirir, "
            "kullanıcının onay kuralını aktif olarak uygular."
        ),
    },
    {
        "name": "bella-ai-tool-sync",
        "slogan": "Bot tool'larını 4 noktada senkron tut — silent fail'i önle",
        "problem": (
            "Bot'un davranışını tanımlayan kod 4 ayrı yerde yaşıyor: "
            "lib/ai-tools.ts (tool şema), app/api/chat/route.ts (executeTool), "
            "SYSTEM_PROMPT (kullanım kuralları), ve form component'ler. "
            "Birinde değişiklik yapılıp diğerleri güncellenmezse bot 'çalışıyor gibi' "
            "görünür ama yanlış iş yapar. TypeScript bunu yakalamaz çünkü string tabanlı."
        ),
        "what": [
            "Tool değişikliği ÖNCESİ 4 sync noktasını tablolu liste halinde sunar",
            "Her nokta için neyin değişmesi gerektiğini açıkça yazdırır",
            "Değişiklik SONRASI checklist'i doğrulattırır — tüm 4 nokta yeşile dönmeden devam etmez",
            "Tarihsel bug referanslarını hatırlatır (Faz 5.5 String(null)='null' örneği)",
            "Bot değişikliği sonrası otomatik bella-chat-smoke-test skill'ini tetikler",
        ],
        "triggers": [
            '"tool parametresi ekleyelim"',
            '"APPOINTMENT_TOOLS değiştir"',
            '"executeTool güncelle"',
            '"bot yeni bir şey yapabilsin"',
            '"system prompt değiştir"',
        ],
        "value": (
            "Sessiz bot bug'larını yaratma fırsatını ortadan kaldırır. "
            "Streaming chat implementasyonu gibi yüksek-riskli işlerde zorunlu."
        ),
    },
    {
        "name": "bella-chat-smoke-test",
        "slogan": "Bot akışının 5 kanonik senaryosu — standart test protokolü",
        "problem": (
            "Chat akışı değiştikten sonra 'test et' deyince bile aklına hangi prompt "
            "yazacağın gelmiyor veya önemli bir senaryoyu unutuyorsun. Özellikle "
            "streaming gibi tool-loop'u etkileyen değişikliklerde bot görsel olarak "
            "çalışır ama randevu Airtable'a düşmez — müşteri kaybı."
        ),
        "what": [
            "5 kanonik senaryoyu prompt + beklenen tool zinciri + kırmızı bayraklar "
            "formatında sunar:",
            "  1) Randevu alma (happy path) — parse + check_availability + book_appointment",
            "  2) İptal — find_appointments + cancel_appointment + GCal sync",
            "  3) Reschedule — find + check + reschedule + GCal delete+create",
            "  4) Personel sorgusu — tool-less (SYSTEM_PROMPT injected data)",
            "  5) Fiyat sorgusu — tool-less (config/client.ts üzerinden)",
            "Her senaryoda hangi bug'ın nasıl görüneceğini listeler",
            "Kullanıcı test sonucunu işaretler — hepsi yeşil olmadan onay vermez",
        ],
        "triggers": [
            "app/api/chat/route.ts değiştiğinde",
            "lib/ai-tools.ts değiştiğinde",
            "ChatInterface/ChatInput değiştiğinde",
            "Streaming implementasyonundan sonra",
            '"bot test et", "chat akışını dene"',
        ],
        "value": (
            "Bot değişikliği sonrası regresyon kaçırma riskini neredeyse sıfıra indirir. "
            "Streaming gibi yüksek-riskli işler için olmazsa olmaz."
        ),
    },
    {
        "name": "bella-timezone-guard",
        "slogan": "Istanbul +03:00 tuzakları — 4 zorunlu soru",
        "problem": (
            "Proje 4 ayrı saat sistemi ile çalışıyor: JavaScript Date, Airtable ISO, "
            "Google Calendar dateTime+timeZone, kullanıcı TR saati. Tek bir offset "
            "unutulursa SMS saatinde, randevu tarihinde, dashboard 'bugün' hesabında, "
            "GCal event zone'unda hata olur — hep ince bugs."
        ),
        "what": [
            "Date/time kodu yazılırken 4 zorunlu soruyu cevaplattırır:",
            "  1) Input formatı (UTC / local / Airtable / user)?",
            "  2) +03:00 offset nasıl uygulandı?",
            "  3) Output kime gidiyor ve hangi format?",
            "  4) Source of truth hangisi (Airtable / GCal / 5.5 staff kararı)?",
            "Tipik hatalı/doğru kod örneklerini karşılaştırmalı gösterir",
            "Kontrol senaryoları listeler (saat 00:00-03:00 hassasiyeti, 'yarın' doğru mu, vs)",
            "Tarihsel bug referanslarını hatırlatır (SMS timezone fix commit 47f976b)",
        ],
        "triggers": [
            '"new Date", "tarih hesabı"',
            '"bugünkü/yarınki", "saat hesabı"',
            '"cron timing", "SMS zamanlama"',
            '"takvim event", "randevu tarihi"',
            "Timezone/UTC/offset geçen her ifade",
        ],
        "value": (
            "Projenin en yaygın bug kategorisini (timezone drift) baştan engeller. "
            "Uzun vadeli sigorta."
        ),
    },
]


ORCHESTRATION = [
    ("Task başlar", "bella-task-start tetiklenir"),
    ("Task bot'a dokunacaksa", "bella-ai-tool-sync uyarısı verilir (task-start içinde)"),
    ("Task date koduna dokunacaksa", "bella-timezone-guard uyarısı verilir"),
    ("Tool değişikliği yapılır", "bella-ai-tool-sync 4 noktayı senkronize eder"),
    ("Task implementasyonu biter", "bella-regression-check çalışır"),
    ("Chat dosyası değiştiyse", "regression-check → bella-chat-smoke-test'i zorunlu kılar"),
    ("Timezone kodu değiştiyse", "regression-check → bella-timezone-guard'a yönlendirir"),
    ("Testler yeşil, deploy istendi", "bella-deploy çalışır (tsc, onay, vercel, post-check)"),
]


# ===================== PDF BUILD =====================

def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="Bella Skills Rehberi", author="Bella Randevu Robotu"
    )
    story = []

    # Kapak
    story.append(Paragraph("Bella Skills Rehberi", h1))
    story.append(Paragraph(
        "Randevu robotu projeleri için Claude Code skill'leri — "
        "ne yapar, nasıl tetiklenir, hangi sorunu çözer.",
        tagline
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "Bu dokümanda 6 adet randevu-robotu skill'inin detayları yer alıyor. "
        "Skill'ler <b>global</b> olarak <b>~/.claude/skills/</b> klasöründe yaşıyor "
        "(Windows'ta <b>C:\\Users\\&lt;kullanıcı&gt;\\.claude\\skills\\</b>). "
        "Bu sayede sadece Bella için değil, aynı bot + dashboard şablonundan "
        "türetilen <b>her yeni müşteri projesi</b> için de otomatik olarak "
        "devreye giriyorlar. Claude Code, kullanıcı mesajındaki tetikleyici "
        "ifadeleri yakalayınca skill'in talimatlarını uyguluyor. Hiçbir skill "
        "kod çalıştırmıyor — sadece Claude'un davranışını yönlendiriyor.",
        body
    ))
    story.append(Spacer(1, 4 * mm))

    # Genel bakış tablosu
    story.append(Paragraph("6 Skill — Tek Bakışta", h2))
    overview = [["Skill", "Ne Zaman Çalışır", "Kritik Fayda"]]
    overview.extend([
        ["bella-task-start", "Task başlangıcı", "Regresyon baseline + model seçimi"],
        ["bella-regression-check", "Task bitişi", "'Ne kırıldı' sistematik sorgu"],
        ["bella-deploy", "Deploy öncesi", "tsc + onay + smoke test"],
        ["bella-ai-tool-sync", "Tool değişimi", "4 nokta sync — silent fail önle"],
        ["bella-chat-smoke-test", "Bot değişim sonrası", "5 kanonik senaryo test"],
        ["bella-timezone-guard", "Date/time kodu", "Istanbul +03:00 tuzakları"],
    ])
    t = Table(overview, colWidths=[4.5 * cm, 5 * cm, 7.5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Arial-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Arial"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("BACKGROUND", (0, 0), (-1, 0), GOLD),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), BG),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("LINEBELOW", (0, 0), (-1, 0), 1, GOLD),
    ]))
    story.append(t)
    story.append(Spacer(1, 8 * mm))

    # Skill system nasıl çalışır
    story.append(Paragraph("Skill'ler Nasıl Aktive Oluyor?", h2))
    story.append(Paragraph(
        "Claude Code, sana yazdığın her mesajı aldığında <b>SKILL.md</b> "
        "dosyalarının frontmatter'ındaki <b>description</b> alanına bakar. "
        "Eğer mesajın skill'in tetikleyici cümlelerinden birine yakınsa, "
        "skill'in içeriği Claude'un bağlamına yüklenir ve talimatlar takip edilir. "
        "Bu tamamen pasif — Claude bir cümle kurunca skill'e başvurur, "
        "manuel aktive etmek gerekmez. "
        "(Ancak bir skill çalıştığını sana <b>\"[skill] kullanılıyor\"</b> "
        "şeklinde bildirir.)",
        body
    ))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        "Skill'ler <b>sadece Markdown</b> — hiçbir kodu çalıştırmıyor, "
        "projenin Next.js build'i, TypeScript, npm, Vercel gibi hiçbir "
        "parçasına temas etmiyor. Güvenli.",
        small
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Neden Global Kurulum?", h3))
    story.append(Paragraph(
        "Skill'ler projeye değil, <b>kullanıcı profiline</b> kurulu. "
        "Bella için yazılan her kural (tool sync, timezone, chat smoke test, deploy) "
        "aynı stack'i kullanan sonraki müşteriler için de geçerli. "
        "Yeni bir müşteri için projeyi klonladığında tek bir kurulum adımı gerekmez — "
        "Claude Code açıldığı anda skill'ler hazır. Skill description'larındaki "
        "<i>\"Randevu robotu projelerinde (Bella ve türevleri...)\"</i> ifadesi, "
        "aynı mimariyi (Next.js + Airtable + Claude + Twilio + GCal) paylaşan "
        "projeleri filtreliyor; alakasız projelerde tetiklenmiyor.",
        body
    ))
    story.append(PageBreak())

    # Her skill için detay
    for i, s in enumerate(SKILLS):
        story.append(Paragraph(f"{i+1}. {s['name']}", h2))
        story.append(Paragraph(s["slogan"], tagline))
        story.append(Spacer(1, 2 * mm))

        story.append(Paragraph("Çözdüğü Problem", h3))
        story.append(Paragraph(s["problem"], body))

        story.append(Paragraph("Ne Yapar", h3))
        for w in s["what"]:
            story.append(bullet(w))

        story.append(Paragraph("Nasıl Aktive Olur", h3))
        story.append(Paragraph("Aşağıdaki ifadelerden biri mesajında geçerse:", small))
        for tr in s["triggers"]:
            story.append(bullet(tr))

        story.append(Paragraph("Değer", h3))
        story.append(Paragraph(s["value"], body))

        if i < len(SKILLS) - 1:
            story.append(Spacer(1, 5 * mm))

    # Orkestrasyon
    story.append(PageBreak())
    story.append(Paragraph("Skill'ler Birbirini Nasıl Tetikliyor?", h2))
    story.append(Paragraph(
        "Skill'ler tek başına çalışmıyor — bir task'ın yaşam döngüsü boyunca "
        "birbirini çağırıyor. Bu orkestrayı kafanda tut:",
        body
    ))
    story.append(Spacer(1, 3 * mm))

    orch_table = [["Durum", "Tetiklenen Skill"]]
    orch_table.extend([list(row) for row in ORCHESTRATION])
    t = Table(orch_table, colWidths=[8 * cm, 9 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Arial-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Arial"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), BG),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    story.append(t)
    story.append(Spacer(1, 6 * mm))

    # Kullanım notları
    story.append(Paragraph("Kullanım Notları", h2))
    story.append(Paragraph(
        "<b>Skill'i manuel çalıştırmak istersen:</b> Mesajına tetikleyici "
        "cümlelerden birini ekle. Örnek: 'streaming task başlayalım' → "
        "bella-task-start otomatik aktif olur.",
        body
    ))
    story.append(Paragraph(
        "<b>Skill'i iptal etmek istersen:</b> 'şimdi skill kullanma, "
        "direkt yap' de. Claude talimatlara uyar, skill'i atlar.",
        body
    ))
    story.append(Paragraph(
        "<b>Skill davranışını değiştirmek istersen:</b> İlgili "
        "<b>~/.claude/skills/&lt;skill-name&gt;/SKILL.md</b> dosyasını edit et "
        "(Windows: <b>C:\\Users\\&lt;kullanıcı&gt;\\.claude\\skills\\&lt;skill-name&gt;\\SKILL.md</b>). "
        "Kod deploy gerekmez — dosya değişikliği hemen etkili. "
        "Yaptığın edit tüm müşteri projelerine aynı anda yansır.",
        body
    ))
    story.append(Paragraph(
        "<b>Skill'i silmek istersen:</b> <b>~/.claude/skills/&lt;skill-name&gt;/</b> "
        "klasörünü sil. Tamamen pasif Markdown, hiçbir yan etki yok.",
        body
    ))
    story.append(Paragraph(
        "<b>Yeni müşteri için kullanmak istersen:</b> Hiçbir ek işlem yok. "
        "Yeni proje klasörünü açıp Claude Code başlattığında skill'ler "
        "hazır — aynı tetikleyici cümleler orada da çalışır.",
        body
    ))
    story.append(Spacer(1, 5 * mm))

    # Footer-ish
    story.append(Paragraph(
        "Hazırlayan: Bella Randevu Robotu · Tarih: 2026-04-21",
        small
    ))

    doc.build(story)
    print(f"PDF oluşturuldu: {output_path}")


if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "BELLA-SKILLS-REHBERI.pdf")
    build_pdf(out)
