"""Yeni Müşteri Onboarding Yol Haritası — PDF generator.

Bella template'ini alıp yeni bir müşteri için kuracak birine (ister sen, ister
yardımcın) her detayı adım adım anlatan tam kapsamlı rehber.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, ListFlowable, ListItem
)

pdfmetrics.registerFont(TTFont("Arial", "C:/Windows/Fonts/arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", "C:/Windows/Fonts/arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", "C:/Windows/Fonts/ariali.ttf"))
pdfmetrics.registerFont(TTFont("Courier", "C:/Windows/Fonts/consola.ttf"))
pdfmetrics.registerFont(TTFont("Courier-Bold", "C:/Windows/Fonts/consolab.ttf"))
pdfmetrics.registerFontFamily(
    "Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic"
)
pdfmetrics.registerFontFamily(
    "Courier", normal="Courier", bold="Courier-Bold"
)

# Renkler
GOLD = HexColor("#B8860B")
DARK = HexColor("#2C2C2C")
SOFT = HexColor("#6B6B6B")
BG = HexColor("#FAF8F3")
BORDER = HexColor("#D4C89A")
WARN_BG = HexColor("#FFF4E5")
WARN_BORDER = HexColor("#E8A23D")
OK_BG = HexColor("#EAF6EA")
OK_BORDER = HexColor("#7AB97A")
CODE_BG = HexColor("#F4F2EC")

# Stiller
styles = getSampleStyleSheet()
h1 = ParagraphStyle(
    "h1", parent=styles["Heading1"], fontName="Arial-Bold", fontSize=26,
    textColor=DARK, spaceAfter=14, leading=32, alignment=TA_CENTER
)
h2 = ParagraphStyle(
    "h2", parent=styles["Heading2"], fontName="Arial-Bold", fontSize=17,
    textColor=GOLD, spaceBefore=18, spaceAfter=10, leading=22
)
h3 = ParagraphStyle(
    "h3", parent=styles["Heading3"], fontName="Arial-Bold", fontSize=13,
    textColor=DARK, spaceBefore=10, spaceAfter=6, leading=17
)
h4 = ParagraphStyle(
    "h4", parent=styles["Heading4"], fontName="Arial-Bold", fontSize=11,
    textColor=GOLD, spaceBefore=6, spaceAfter=3, leading=14
)
body = ParagraphStyle(
    "body", parent=styles["BodyText"], fontName="Arial", fontSize=10.5,
    textColor=DARK, leading=15.5, spaceAfter=6, alignment=TA_LEFT
)
small = ParagraphStyle(
    "small", parent=body, fontSize=9, textColor=SOFT, leading=12
)
tagline = ParagraphStyle(
    "tagline", parent=body, fontName="Arial-Italic", textColor=SOFT,
    fontSize=11, leading=14, spaceAfter=10, alignment=TA_CENTER
)
code = ParagraphStyle(
    "code", parent=body, fontName="Courier", fontSize=9, textColor=DARK,
    backColor=CODE_BG, leftIndent=10, rightIndent=10, leading=12.5,
    spaceBefore=4, spaceAfter=6, borderColor=BORDER, borderWidth=0.3,
    borderPadding=6
)
warn = ParagraphStyle(
    "warn", parent=body, fontSize=10, backColor=WARN_BG,
    borderColor=WARN_BORDER, borderWidth=0.6, borderPadding=8,
    leftIndent=0, rightIndent=0, spaceBefore=4, spaceAfter=8
)
okbox = ParagraphStyle(
    "ok", parent=body, fontSize=10, backColor=OK_BG,
    borderColor=OK_BORDER, borderWidth=0.6, borderPadding=8,
    leftIndent=0, rightIndent=0, spaceBefore=4, spaceAfter=8
)


def cmd(text):
    return Paragraph(text, code)


def warning(text):
    return Paragraph(f"<b>⚠ Dikkat:</b> {text}", warn)


def success(text):
    return Paragraph(f"<b>✓ Beklenen:</b> {text}", okbox)


def bullet(text):
    return Paragraph(f"• {text}", body)


def checkbox(text):
    return Paragraph(f"☐ {text}", body)


def steps_table(rows):
    """Adım tablosu — sol: numara, sağ: açıklama."""
    t = Table(rows, colWidths=[1.2 * cm, 15.3 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Arial"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD),
        ("FONTNAME", (0, 0), (0, -1), "Arial-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def info_table(rows, col_widths=None):
    t = Table(rows, colWidths=col_widths or [5 * cm, 11.5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Arial"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD),
        ("FONTNAME", (0, 0), (0, -1), "Arial-Bold"),
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


# ============================================================
# PDF BUILD
# ============================================================

def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=1.8 * cm, rightMargin=1.8 * cm,
        topMargin=1.8 * cm, bottomMargin=1.8 * cm,
        title="Yeni Müşteri Onboarding Yol Haritası",
        author="Bella Randevu Robotu"
    )
    s = []  # story

    # ─────────────────────────── KAPAK ───────────────────────────
    s.append(Spacer(1, 3 * cm))
    s.append(Paragraph("Yeni Müşteri Onboarding", h1))
    s.append(Paragraph("Yol Haritası", h1))
    s.append(Spacer(1, 6 * mm))
    s.append(Paragraph(
        "Bella template'inden yeni bir müşteri projesi nasıl oluşturulur — "
        "proje klasörünü açmaktan canlıya almaya kadar her detay, adım adım.",
        tagline
    ))
    s.append(Spacer(1, 2 * cm))
    s.append(Paragraph(
        "Tarih: 2026-04-21 · Sürüm: v1 · Hazırlayan: Bella Randevu Robotu",
        small
    ))
    s.append(PageBreak())

    # ─────────────────────── İÇİNDEKİLER ───────────────────────
    s.append(Paragraph("İçindekiler", h2))
    toc = [
        ["0.", "Bu Rehber Kime Göre — Nasıl Kullanılır"],
        ["1.", "Hazırlık: Müşteri Bilgi Formu"],
        ["2.", "Adım 1 — Proje klasörünü kopyala"],
        ["3.", "Adım 2 — Temiz git başlat"],
        ["4.", "Adım 3 — config/client.ts kişiselleştirme"],
        ["5.", "Adım 4 — app/layout.tsx: başlık + açıklama"],
        ["6.", "Adım 5 — Airtable base kurulumu (şema dahil)"],
        ["7.", "Adım 6 — Google Calendar API + OAuth token"],
        ["8.", "Adım 7 — Twilio SMS kurulumu"],
        ["9.", "Adım 8 — Clerk auth (dashboard login)"],
        ["10.", "Adım 9 — Anthropic API key"],
        ["11.", "Adım 10 — .env.local: tüm env vars"],
        ["12.", "Adım 11 — npm install + lokal test"],
        ["13.", "Adım 12 — GitHub repo + push"],
        ["14.", "Adım 13 — Vercel deploy"],
        ["15.", "Adım 14 — Vercel env vars"],
        ["16.", "Adım 15 — cron-job.org SMS cron"],
        ["17.", "Adım 16 — Production smoke test"],
        ["18.", "Adım 17 — Müşteriye teslim"],
        ["19.", "En Kolay Yol (Speed-Run)"],
        ["20.", "Master Checklist (tek sayfa)"],
        ["21.", "Sık Karşılaşılan Hatalar + Çözüm"],
    ]
    s.append(steps_table(toc))
    s.append(PageBreak())

    # ─────────────── 0: BU REHBER KİME GÖRE ───────────────
    s.append(Paragraph("0. Bu Rehber Kime Göre — Nasıl Kullanılır", h2))
    s.append(Paragraph(
        "Bu rehber, Bella Güzellik Salonu için yazılmış randevu robotunu "
        "<b>başka bir işletme için</b> (örneğin Yasemin Berber, Ahmet Kuaför, "
        "Dr. Mehmet Estetik) kuracak kişiye yönelik. Hedef kitle: sen veya "
        "senin adına bu işi yapacak birisi — yazılımcı değil de tıkır tıkır "
        "yönergeleri takip edebilen biri.",
        body
    ))
    s.append(Paragraph(
        "Bütün adımlar sırayla okunduğunda <b>yeni bir müşteri ~2 saat içinde "
        "canlıya alınabilir</b>. İlk sefer daha uzun sürebilir; sonraki "
        "müşterilerde yarım saate iner.",
        body
    ))
    s.append(Paragraph("Kullanım şekli", h3))
    s.append(bullet("Her adımı bir kere oku, sonra yap."))
    s.append(bullet("Adımın sonundaki <b>Beklenen</b> kutusu gerçekleşmediyse durup geri git."))
    s.append(bullet("<b>Dikkat</b> kutuları daha önce yakıldığım noktalar — es geçme."))
    s.append(bullet("En sondaki Master Checklist'i yazdır, her müşteriye işaretleyerek kullan."))
    s.append(Spacer(1, 3 * mm))
    s.append(warning(
        "Bu rehberin <b>v1</b> sürümü. Proje faz 6/7 tamamlanınca dashboard "
        "bileşenleri bölümü (Adım 3 ve 4 civarı) genişletilecek. Bu sürüm "
        "temel klonlama için yeterli."
    ))
    s.append(PageBreak())

    # ─────────────── 1: HAZIRLIK ───────────────
    s.append(Paragraph("1. Hazırlık: Müşteri Bilgi Formu", h2))
    s.append(Paragraph(
        "Kuruluma başlamadan önce müşteriden şu bilgileri topla. Bilgiler "
        "eksikse sonra 'ne yazacağım' diye dönüp durursun. Tamamını topla.",
        body
    ))

    s.append(Paragraph("İşletme kimliği", h3))
    s.append(checkbox("İşletme adı (örn: 'Yasemin Güzellik Merkezi')"))
    s.append(checkbox("Bot'un ismi (örn: 'Yasemin' — genelde işletmenin ismi)"))
    s.append(checkbox("İşletme telefonu (müşterilerin aradığı)"))
    s.append(checkbox("Instagram kullanıcı adı (SMS/bot bağlantısında kullanılır)"))
    s.append(checkbox("Adres + şehir"))
    s.append(checkbox("Welcome emoji (💇‍♀️ 💅 💈 🧴 — sektöre göre)"))

    s.append(Paragraph("Çalışma düzeni", h3))
    s.append(checkbox("Açılış ve kapanış saati (örn: 09:00 - 19:00)"))
    s.append(checkbox("Çalışma günleri (Pzt-Cts? Her gün? Pazartesi kapalı?)"))
    s.append(checkbox("Randevu slot süresi (30 dk standart)"))
    s.append(checkbox("Öğle arası var mı? Hangi saatler?"))

    s.append(Paragraph("Hizmetler", h3))
    s.append(Paragraph(
        "Her hizmet için: <b>isim, süre (dakika), fiyat (₺)</b>. "
        "Bella'nın formatı şöyle (config/client.ts içinden):",
        body
    ))
    s.append(cmd(
        "{ name: 'Saç Kesimi', duration: 45, price: 350 },<br/>"
        "{ name: 'Saç Boyama', duration: 120, price: 950 },<br/>"
        "{ name: 'Manikür', duration: 60, price: 280 },"
    ))
    s.append(checkbox("Hizmet listesi (isim + süre + fiyat) — en az 3, en fazla ~15 ideal"))

    s.append(Paragraph("Personel (isteğe bağlı)", h3))
    s.append(Paragraph(
        "Eğer müşteri tek kişi çalışıyorsa personel adımı atlanabilir. "
        "Birden fazla kişi çalışıyorsa her biri için:",
        body
    ))
    s.append(checkbox("Ad Soyad"))
    s.append(checkbox("Rol (örn: 'Kuaför', 'Estetisyen', 'Manikürist')"))
    s.append(checkbox("Hangi hizmetleri yapıyor"))

    s.append(Paragraph("Branding (isteğe bağlı, ileri seviye)", h3))
    s.append(checkbox("Logo (PNG, şeffaf arka plan, 512x512 ideal)"))
    s.append(checkbox("Favicon (16x16, 32x32 — logo'dan türetilebilir)"))
    s.append(checkbox("Ana renk kodu (Bella gold: #B8860B) — istenirse değiştirilir"))

    s.append(Paragraph("Domain (isteğe bağlı)", h3))
    s.append(checkbox("Müşteri kendi domain'ini mi kullanacak yoksa vercel.app subdomain mi?"))
    s.append(checkbox("Kendi domain'i ise: GoDaddy/Namecheap gibi registrar bilgisi"))

    s.append(PageBreak())

    # ─────────────── 2: ADIM 1 — PROJE KLASÖRÜ ───────────────
    s.append(Paragraph("2. Adım 1 — Proje klasörünü kopyala", h2))
    s.append(Paragraph("2.1. Kaynak klasörü bul", h3))
    s.append(Paragraph(
        "Bella proje klasörü şu yolda:", body
    ))
    s.append(cmd("D:\\masaüstü -gg\\ai randevu robotu\\"))

    s.append(Paragraph("2.2. Klasörü kopyala (Windows)", h3))
    s.append(Paragraph("File Explorer'da:", body))
    s.append(bullet("Klasörü seç → <b>Ctrl+C</b>"))
    s.append(bullet("Aynı (veya farklı) dizine → <b>Ctrl+V</b>"))
    s.append(bullet("Yeni klasörün adını değiştir: sağ tık → Rename"))
    s.append(bullet("Yeni isim örneği: <b>yasemin-randevu-robotu</b> (küçük harf, tire ile)"))

    s.append(Paragraph("2.3. Gereksiz dosyaları sil", h3))
    s.append(Paragraph(
        "Kopyalanan klasörde şunları sil (lazım değil, sadece yer kaplıyor):",
        body
    ))
    s.append(bullet("<b>node_modules/</b> klasörü (çok büyük, yeniden kurulacak)"))
    s.append(bullet("<b>.next/</b> klasörü (build cache)"))
    s.append(bullet("<b>.git/</b> klasörü (eski git geçmişi istemiyoruz, temiz başlayacağız)"))
    s.append(bullet("<b>tsconfig.tsbuildinfo</b> (TypeScript cache)"))
    s.append(warning(
        "<b>.env.local</b> dosyasını <b>silme</b> — içini değiştireceğiz. "
        "Yedek al: .env.local-bella-backup adıyla kopyala."
    ))

    s.append(Paragraph("2.4. VS Code ile aç", h3))
    s.append(cmd("code \"D:\\path\\to\\yasemin-randevu-robotu\""))
    s.append(Paragraph(
        "Ya da File Explorer'da klasöre sağ tık → 'Open with Code'.",
        small
    ))
    s.append(success(
        "VS Code açıldı, sol tarafta app/, components/, lib/, config/ "
        "klasörlerini görüyorsun. node_modules yok (henüz npm install yapmadık)."
    ))

    s.append(PageBreak())

    # ─────────────── 3: ADIM 2 — GIT ───────────────
    s.append(Paragraph("3. Adım 2 — Temiz git başlat", h2))
    s.append(Paragraph(
        "Yeni müşteri için yeni bir git geçmişi istiyoruz. Bella'nın commit "
        "geçmişi yeni müşterinin repo'sunda görünmesin.",
        body
    ))

    s.append(Paragraph("3.1. Git init", h3))
    s.append(Paragraph("VS Code'da terminal aç (<b>Ctrl+`</b>):", body))
    s.append(cmd(
        "git init<br/>"
        "git add .<br/>"
        "git commit -m \"initial commit: yasemin template from bella\""
    ))

    s.append(Paragraph("3.2. Ana branch'i main yap", h3))
    s.append(cmd("git branch -M main"))
    s.append(Paragraph(
        "Vercel ve GitHub varsayılan olarak <b>main</b> bekler; emin olalım.",
        small
    ))

    s.append(success(
        "<b>git log</b> yazdığında sadece 1 commit görüyorsun (yeni repo). "
        "Bella'nın eski commit'leri yok."
    ))

    s.append(PageBreak())

    # ─────────────── 4: ADIM 3 — config/client.ts ───────────────
    s.append(Paragraph("4. Adım 3 — config/client.ts kişiselleştirme", h2))
    s.append(Paragraph(
        "Bu <b>en önemli dosya</b>. Bot'un kim olduğunu, hangi hizmetleri "
        "verdiğini, çalışma saatlerini buradan öğreniyor. Dikkatli düzenle.",
        body
    ))

    s.append(Paragraph("4.1. Dosyayı aç", h3))
    s.append(cmd("config/client.ts"))

    s.append(Paragraph("4.2. İşletme bilgilerini güncelle", h3))
    s.append(Paragraph("Bella'nın orijinal hali:", small))
    s.append(cmd(
        "businessName: 'Bella Güzellik Salonu',<br/>"
        "assistantName: 'Bella',<br/>"
        "welcomeEmoji: '💇‍♀️',"
    ))
    s.append(Paragraph("Yeni müşteri için örnek:", small))
    s.append(cmd(
        "businessName: 'Yasemin Güzellik Merkezi',<br/>"
        "assistantName: 'Yasemin',<br/>"
        "welcomeEmoji: '💅',"
    ))

    s.append(Paragraph("4.3. Hizmetleri güncelle", h3))
    s.append(Paragraph(
        "Hizmetlerin tamamını Bella'nınkilerle değiştir. Format çok önemli "
        "— virgül, süslü parantez, tırnak işaretleri değişmemeli:",
        body
    ))
    s.append(cmd(
        "services: [<br/>"
        "&nbsp;&nbsp;{ name: 'Kaş Tasarımı', duration: 30, price: 250 },<br/>"
        "&nbsp;&nbsp;{ name: 'Protez Tırnak', duration: 90, price: 450 },<br/>"
        "&nbsp;&nbsp;{ name: 'Kalıcı Oje', duration: 45, price: 200 },<br/>"
        "] as const,"
    ))
    s.append(warning(
        "Son hizmetten sonra da <b>virgül</b> var. 'as const' ifadesi "
        "TypeScript için önemli — silme."
    ))

    s.append(Paragraph("4.4. Çalışma saatlerini güncelle", h3))
    s.append(cmd(
        "workingHours: {<br/>"
        "&nbsp;&nbsp;start: 9,             // açılış saati (0-23)<br/>"
        "&nbsp;&nbsp;end: 20,              // kapanış saati<br/>"
        "&nbsp;&nbsp;slotMinutes: 30,<br/>"
        "&nbsp;&nbsp;workingDays: [1,2,3,4,5,6], // 0=Pzr 1=Pzt ... 6=Cts<br/>"
        "&nbsp;&nbsp;workingDaysLabel: 'Pazartesi-Cumartesi',<br/>"
        "},"
    ))
    s.append(bullet("Pazartesi kapalıysa: <b>[2,3,4,5,6,0]</b>"))
    s.append(bullet("Her gün açıksa: <b>[0,1,2,3,4,5,6]</b>"))

    s.append(Paragraph("4.5. Kaydet ve kontrol et", h3))
    s.append(cmd("npx tsc --noEmit"))
    s.append(success(
        "Hata çıkmazsa config doğru. Hata varsa mesajda hangi satır "
        "olduğunu söyler — virgül/tırnak hatasıdır büyük ihtimalle."
    ))

    s.append(PageBreak())

    # ─────────────── 5: ADIM 4 — app/layout.tsx ───────────────
    s.append(Paragraph("5. Adım 4 — app/layout.tsx: başlık + açıklama", h2))
    s.append(Paragraph(
        "Tarayıcı sekmesinde görünen başlık ve Google'da çıkan açıklama "
        "<b>app/layout.tsx</b> dosyasında. config/client.ts'ten değil, "
        "elle düzenleniyor.",
        body
    ))

    s.append(Paragraph("5.1. Dosyayı aç", h3))
    s.append(cmd("app/layout.tsx"))

    s.append(Paragraph("5.2. Metadata'yı değiştir", h3))
    s.append(Paragraph("Bella'nın orijinal hali:", small))
    s.append(cmd(
        "export const metadata: Metadata = {<br/>"
        "&nbsp;&nbsp;title: 'Bella Güzellik Salonu — Online Randevu',<br/>"
        "&nbsp;&nbsp;description: 'Yapay zeka destekli randevu sistemi ile 7/24 randevu alın',<br/>"
        "};"
    ))
    s.append(Paragraph("Yeni müşteri için:", small))
    s.append(cmd(
        "export const metadata: Metadata = {<br/>"
        "&nbsp;&nbsp;title: 'Yasemin Güzellik Merkezi — Online Randevu',<br/>"
        "&nbsp;&nbsp;description: '7/24 yapay zeka ile randevu alın. Kaş, tırnak, cilt bakımı.',<br/>"
        "};"
    ))
    s.append(success(
        "<b>npm run dev</b> ile başlattığında tarayıcı sekmesinde yeni "
        "başlık görünür."
    ))

    s.append(PageBreak())

    # ─────────────── 6: ADIM 5 — AIRTABLE ───────────────
    s.append(Paragraph("6. Adım 5 — Airtable base kurulumu", h2))
    s.append(Paragraph(
        "Airtable, randevu ve personel verisinin saklandığı yer. Her "
        "müşterinin kendi base'i olmalı — Bella'nınkini paylaşma.",
        body
    ))

    s.append(Paragraph("6.1. Airtable hesabı ve yeni base", h3))
    s.append(bullet("airtable.com adresine git, giriş yap (ücretsiz plan yeterli)"))
    s.append(bullet("<b>Create a base</b> → <b>Start from scratch</b>"))
    s.append(bullet("Base adı: <b>Yasemin Randevu</b> (müşteri ismiyle)"))

    s.append(Paragraph("6.2. 'Randevular' tablosu kur", h3))
    s.append(Paragraph(
        "İlk tablo otomatik oluşur — adını <b>Randevular</b> yap (double-click). "
        "Sonra şu alanları (field) ekle — <b>tam olarak bu isimler ve tipler</b>:",
        body
    ))
    randevular_fields = [
        ["Alan adı", "Tip", "Not"],
        ["customerName", "Single line text", "Primary field (ilk alan)"],
        ["customerPhone", "Phone number", "-"],
        ["service", "Single line text", "Hizmet adı (config'teki ile aynı)"],
        ["date", "Date", "ISO format 2026-04-21"],
        ["time", "Single line text", "'14:30' formatı"],
        ["durationMinutes", "Number", "Integer"],
        ["status", "Single select", "confirmed, cancelled, completed"],
        ["notes", "Long text", "-"],
        ["createdAt", "Created time", "Otomatik"],
        ["isNoShow", "Checkbox", "-"],
        ["paymentStatus", "Single select", "unpaid, paid, partial"],
        ["paymentMethod", "Single select", "cash, card, bank_transfer"],
        ["paidAmount", "Number", "TL cinsinden"],
        ["googleCalendarEventId", "Single line text", "Otomatik doldurulur"],
        ["staffId", "Link to Staff", "Sonra oluşturulacak tabloya bağ"],
        ["staffName", "Lookup", "staffId → Staff.name"],
    ]
    t = Table(randevular_fields, colWidths=[4.5 * cm, 3.5 * cm, 8.5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Arial-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Arial"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), GOLD),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), BG),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    s.append(t)
    s.append(warning(
        "Alan adları <b>büyük-küçük harf duyarlı</b>. customerName ile CustomerName farklı. "
        "Koddaki tam haliyle yazılmalı."
    ))

    s.append(Paragraph("6.3. 'Staff' tablosu kur", h3))
    s.append(Paragraph(
        "Alt tarafta <b>+ Add or import</b> → <b>Create empty table</b> → "
        "adını <b>Staff</b> yap. Alanları:",
        body
    ))
    staff_fields = [
        ["Alan adı", "Tip", "Not"],
        ["name", "Single line text", "Primary field"],
        ["role", "Single line text", "Kuaför, Estetisyen..."],
        ["services", "Multiple select", "Hizmet isimleri config'le aynı"],
        ["active", "Checkbox", "Pasif personel görünmesin"],
    ]
    t = Table(staff_fields, colWidths=[4.5 * cm, 3.5 * cm, 8.5 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Arial-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Arial"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), GOLD),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), BG),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    s.append(t)

    s.append(Paragraph("6.4. Personeli ekle", h3))
    s.append(bullet("Staff tablosunda <b>+ Add record</b> → müşterinin personelini tek tek ekle"))
    s.append(bullet("active = ✓ (tik at)"))
    s.append(bullet("services = ilgili hizmetleri seç"))

    s.append(Paragraph("6.5. API key ve Base ID al", h3))
    s.append(bullet("airtable.com/create/tokens → <b>Create new token</b>"))
    s.append(bullet("Name: 'yasemin-app'; Scopes: <b>data.records:read, data.records:write, schema.bases:read</b>"))
    s.append(bullet("Access: Bu yeni base'i seç → <b>Create token</b>"))
    s.append(bullet("Token'ı kopyala — sadece bir kere görünüyor. <b>AIRTABLE_API_KEY</b> bu."))
    s.append(bullet("Base ID için: airtable.com/api → base'i seç → URL'deki <b>app...</b> kısmı"))
    s.append(bullet("Veya base açıkken: Help → API documentation → 'The ID of this base is app...'"))
    s.append(success(
        "API key (<b>pat...</b>) ve Base ID (<b>app...</b>) elinde. "
        "Geçici olarak not defterine kaydet, .env.local'e sonra yazacağız."
    ))

    s.append(PageBreak())

    # ─────────────── 7: ADIM 6 — GOOGLE CALENDAR ───────────────
    s.append(Paragraph("7. Adım 6 — Google Calendar API + OAuth", h2))
    s.append(Paragraph(
        "Bella'nın Google Calendar kurulumu <b>OAuth2 + refresh token</b> "
        "kullanıyor (service account değil). Yeni müşteri için ya aynı "
        "Google hesabını kullanırsın (Bella'nın) ya da müşterinin kendi "
        "Google hesabını bağlarsın.",
        body
    ))
    s.append(warning(
        "<b>Kısa yol (önerilen):</b> Bella'nın GOOGLE_CLIENT_ID, CLIENT_SECRET "
        "ve REFRESH_TOKEN'ını aynen kullan, sadece GOOGLE_CALENDAR_ID'yi "
        "değiştir — her müşteri kendi takvimini alır. Aşağıdaki 7.1'i oku."
    ))

    s.append(Paragraph("7.1. Kısa yol — ayrı takvim, aynı hesap", h3))
    s.append(bullet("calendar.google.com → sol alt <b>Other calendars → +</b> → <b>Create new calendar</b>"))
    s.append(bullet("Name: 'Yasemin Güzellik — Randevular'"))
    s.append(bullet("Zaman dilimi: <b>(GMT+03:00) Istanbul</b>"))
    s.append(bullet("Oluştur → sol listede yeni takvim çıktı"))
    s.append(bullet("Yeni takvimin <b>3 noktalı menüsü</b> → <b>Settings and sharing</b>"))
    s.append(bullet("Aşağıda <b>Calendar ID</b> var — şuna benzer: <b>c_abc123@group.calendar.google.com</b>"))
    s.append(bullet("Bu ID'yi kopyala — <b>GOOGLE_CALENDAR_ID</b> bu."))
    s.append(bullet("CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN Bella'nınkilerle aynı kalır"))
    s.append(success(
        "Bella hesabının yetkisi zaten OAuth ile verildiği için, yeni takvime "
        "de erişebilir. Bu en pratik yol."
    ))

    s.append(Paragraph("7.2. Uzun yol — müşterinin kendi Google hesabı", h3))
    s.append(Paragraph(
        "Müşteri kendi takviminden yönetmek istiyorsa OAuth flow'u kendi "
        "hesabıyla yeniden yapılmalı. Bu karmaşık — <b>v2 sürümünde</b> "
        "detaylandırılacak. İlk müşterilerde kısa yolu kullan.",
        body
    ))

    s.append(PageBreak())

    # ─────────────── 8: ADIM 7 — TWILIO ───────────────
    s.append(Paragraph("8. Adım 7 — Twilio SMS kurulumu", h2))
    s.append(Paragraph(
        "SMS hatırlatmaları için Twilio kullanıyoruz. Her müşteri için "
        "iki seçenek var:",
        body
    ))
    s.append(bullet("<b>Seçenek A:</b> Bella'nın Twilio numarasını paylaş (maliyet ucuz, basit)"))
    s.append(bullet("<b>Seçenek B:</b> Müşteri için yeni bir Twilio numara al ($1-2/ay)"))
    s.append(warning(
        "Seçenek A'da SMS'ler Bella'nın Twilio hesabından gider ama "
        "<b>mesaj içinde işletme adı</b> olduğu için müşteri farkına varmaz. "
        "Dezavantaj: Bella hesabının aylık limiti tüm müşterilere paylaşılır."
    ))

    s.append(Paragraph("8.1. Seçenek A — mevcut numarayı kullan", h3))
    s.append(bullet("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER → Bella'nınkilerle aynı"))
    s.append(bullet("Atla 8.2'yi."))

    s.append(Paragraph("8.2. Seçenek B — yeni numara", h3))
    s.append(bullet("twilio.com → giriş yap → <b>Phone Numbers → Buy a Number</b>"))
    s.append(bullet("Country: US (en ucuz), Capabilities: SMS ✓"))
    s.append(bullet("Satın al — ~$1.15/ay"))
    s.append(bullet("Yeni numarayı kopyala (+1...)"))
    s.append(bullet("Account SID ve Auth Token: twilio.com dashboard sağ üst köşesinde"))
    s.append(Paragraph("<b>Not:</b> ACCOUNT_SID ve AUTH_TOKEN aynı hesap içinde hep aynıdır; sadece PHONE_NUMBER değişir.", small))

    s.append(PageBreak())

    # ─────────────── 9: ADIM 8 — CLERK ───────────────
    s.append(Paragraph("9. Adım 8 — Clerk auth (dashboard login)", h2))
    s.append(Paragraph(
        "Dashboard (sahibin gördüğü panel) Clerk ile korumalı. Her müşteri "
        "kendi Clerk uygulamasına sahip olmalı — aksi halde Bella'nın "
        "kullanıcıları Yasemin'in dashboard'una da girebilir.",
        body
    ))

    s.append(Paragraph("9.1. Clerk yeni app", h3))
    s.append(bullet("clerk.com → dashboard → <b>Create application</b>"))
    s.append(bullet("Name: 'Yasemin Randevu'"))
    s.append(bullet("Sign-in options: <b>Email + Password</b> (yeterli), Google isteğe bağlı"))
    s.append(bullet("<b>Create application</b>"))

    s.append(Paragraph("9.2. API anahtarlarını al", h3))
    s.append(bullet("Sol menü → <b>API Keys</b>"))
    s.append(bullet("<b>Publishable key</b> kopyala (pk_test_...) → <b>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</b>"))
    s.append(bullet("<b>Secret key</b> kopyala (sk_test_...) → <b>CLERK_SECRET_KEY</b>"))

    s.append(Paragraph("9.3. Müşteri hesabını oluştur", h3))
    s.append(bullet("Sol menü → <b>Users</b> → <b>Create user</b>"))
    s.append(bullet("Email: müşterinin email'i, şifre: geçici bir şifre (sonra değiştirecek)"))
    s.append(bullet("<b>Create</b>"))

    s.append(success(
        "3 bilgi topladın: Publishable key, Secret key, müşteri email + şifresi. "
        "Son ikisini müşteriye güvenli şekilde ilet."
    ))

    s.append(PageBreak())

    # ─────────────── 10: ADIM 9 — ANTHROPIC ───────────────
    s.append(Paragraph("10. Adım 9 — Anthropic API key", h2))
    s.append(Paragraph(
        "Bot'un beyni Claude. Anthropic API key gerekiyor.",
        body
    ))

    s.append(Paragraph("10.1. Seçenek A — Bella'nınkini paylaş (önerilen)", h3))
    s.append(Paragraph(
        "Anthropic aynı API key'i birden fazla projede kullanmaya izin veriyor. "
        "Faturalandırma toplam kullanım üzerinden yapılır. Küçük ölçekte "
        "en basiti bu.",
        body
    ))
    s.append(bullet("ANTHROPIC_API_KEY = Bella'nın key'i ile aynı"))

    s.append(Paragraph("10.2. Seçenek B — Müşteriye özel key (ileri seviye)", h3))
    s.append(bullet("console.anthropic.com → Settings → Workspaces → New workspace"))
    s.append(bullet("'Yasemin' adında workspace oluştur"))
    s.append(bullet("API keys → Create key → key'i kopyala"))
    s.append(Paragraph(
        "Bu yaklaşımın faydası: müşteri bazlı maliyet takibi ve rate limit "
        "ayrımı. Çok müşterili ölçekte buraya geçilir.",
        small
    ))

    s.append(PageBreak())

    # ─────────────── 11: ADIM 10 — .env.local ───────────────
    s.append(Paragraph("11. Adım 10 — .env.local: tüm env vars", h2))
    s.append(Paragraph(
        "Şimdiye kadar topladığın tüm anahtarları tek dosyaya yazacağız. "
        "Bu dosya <b>git'e commit edilmez</b> — güvenlik.",
        body
    ))

    s.append(Paragraph("11.1. Mevcut .env.local'i aç", h3))
    s.append(cmd(".env.local"))
    s.append(Paragraph(
        "Bella'nın tüm anahtarları şu anda içinde. Tek tek değiştireceğiz.",
        small
    ))

    s.append(Paragraph("11.2. Yeni env vars (şablon)", h3))
    s.append(cmd(
        "# Anthropic<br/>"
        "ANTHROPIC_API_KEY=sk-ant-api03-...<br/>"
        "<br/>"
        "# Airtable<br/>"
        "AIRTABLE_API_KEY=pat...<br/>"
        "AIRTABLE_BASE_ID=app...   # Yeni base ID!<br/>"
        "AIRTABLE_TABLE_NAME=Randevular<br/>"
        "AIRTABLE_STAFF_TABLE=Staff<br/>"
        "<br/>"
        "# Google Calendar<br/>"
        "GOOGLE_CLIENT_ID=...<br/>"
        "GOOGLE_CLIENT_SECRET=...<br/>"
        "GOOGLE_REFRESH_TOKEN=...<br/>"
        "GOOGLE_CALENDAR_ID=c_abc123@group.calendar.google.com   # YENİ!<br/>"
        "<br/>"
        "# Clerk (YENİ — her müşteri ayrı)<br/>"
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...<br/>"
        "CLERK_SECRET_KEY=sk_test_...<br/>"
        "NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in<br/>"
        "NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up<br/>"
        "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard<br/>"
        "<br/>"
        "# Twilio<br/>"
        "TWILIO_ACCOUNT_SID=AC...<br/>"
        "TWILIO_AUTH_TOKEN=...<br/>"
        "TWILIO_PHONE_NUMBER=+1...<br/>"
        "<br/>"
        "# Cron güvenlik (her müşteri için farklı, rastgele string)<br/>"
        "CRON_SECRET=yasemin2026gizli"
    ))

    s.append(Paragraph("11.3. Değişecek / aynı kalacak tablosu", h3))
    env_changes = [
        ["Env Var", "Değişir mi", "Nereden"],
        ["ANTHROPIC_API_KEY", "İsteğe bağlı", "Adım 9'daki seçim"],
        ["AIRTABLE_API_KEY", "Evet", "Adım 5.5 yeni token"],
        ["AIRTABLE_BASE_ID", "Evet", "Adım 5 yeni base"],
        ["AIRTABLE_TABLE_NAME", "Hayır", "'Randevular'"],
        ["AIRTABLE_STAFF_TABLE", "Hayır", "'Staff'"],
        ["GOOGLE_CLIENT_ID", "Hayır (kısa yol)", "Bella'nınki"],
        ["GOOGLE_CLIENT_SECRET", "Hayır (kısa yol)", "Bella'nınki"],
        ["GOOGLE_REFRESH_TOKEN", "Hayır (kısa yol)", "Bella'nınki"],
        ["GOOGLE_CALENDAR_ID", "Evet", "Adım 6.1 yeni takvim ID"],
        ["CLERK_*", "Evet", "Adım 8 yeni app"],
        ["TWILIO_*", "Seçenek A/B'ye göre", "Adım 7"],
        ["CRON_SECRET", "Evet", "Rastgele string yaz"],
    ]
    t = Table(env_changes, colWidths=[5 * cm, 3.5 * cm, 8 * cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Arial-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Arial"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), GOLD),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), BG),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    s.append(t)

    s.append(warning(
        "CRON_SECRET her müşteri için <b>farklı ve rastgele</b> olmalı. "
        "Bella'nınkini kullanma — müşteri cron endpoint'ini tetiklenebilir. "
        "Örnek: <b>yasemin2026-a9f3k2</b> gibi."
    ))

    s.append(PageBreak())

    # ─────────────── 12: ADIM 11 — LOKAL TEST ───────────────
    s.append(Paragraph("12. Adım 11 — npm install + lokal test", h2))

    s.append(Paragraph("12.1. Bağımlılıkları kur", h3))
    s.append(cmd("npm install"))
    s.append(Paragraph(
        "2-4 dakika sürer. Hata çıkarsa Node.js sürümünü kontrol et "
        "(v20 LTS veya üzeri önerilir).",
        small
    ))

    s.append(Paragraph("12.2. TypeScript kontrolü", h3))
    s.append(cmd("npx tsc --noEmit"))
    s.append(success("Hiç hata vermemeli. Hata varsa config/client.ts'te yazım yanlışı olabilir."))

    s.append(Paragraph("12.3. Dev server başlat", h3))
    s.append(cmd("npm run dev"))
    s.append(Paragraph("Tarayıcıda aç: <b>http://localhost:3000</b>", body))

    s.append(Paragraph("12.4. Lokal smoke test", h3))
    s.append(checkbox("Ana sayfa yükleniyor (işletme adı doğru görünüyor)"))
    s.append(checkbox("Chat penceresi açılıyor, welcome mesajı doğru (assistantName)"))
    s.append(checkbox("Chat'e 'randevu almak istiyorum' yaz → bot cevap veriyor"))
    s.append(checkbox("Dashboard: <b>http://localhost:3000/dashboard</b> → Clerk sign-in'e yönlendiriyor"))
    s.append(checkbox("Sign-in ile Adım 8'de oluşturduğun email/şifre ile giriş yap"))
    s.append(checkbox("Dashboard yükleniyor (randevu listesi boş — normal)"))

    s.append(Paragraph("12.5. Gerçek randevu testi", h3))
    s.append(bullet("Chat'e: 'Yarın saat 15:00'e <b>[hizmet]</b>. Adım Test, telefon 0555 123 45 67'"))
    s.append(bullet("Bot onay verdikten sonra Airtable base'i aç"))
    s.append(bullet("'Randevular' tablosunda yeni kayıt görmeli misin"))
    s.append(bullet("Google Calendar'ı aç — yeni etkinlik var mı?"))
    s.append(success(
        "Her iki yerde de randevu kaydı varsa → <b>entegrasyonlar çalışıyor</b>. "
        "Lokal test tamamlandı."
    ))

    s.append(PageBreak())

    # ─────────────── 13: ADIM 12 — GITHUB ───────────────
    s.append(Paragraph("13. Adım 12 — GitHub repo + push", h2))

    s.append(Paragraph("13.1. Yeni repo oluştur", h3))
    s.append(bullet("github.com → sağ üst <b>+</b> → <b>New repository</b>"))
    s.append(bullet("Repository name: <b>yasemin-randevu-robotu</b>"))
    s.append(bullet("<b>Private</b> seç (müşteri verisi olan kod)"))
    s.append(bullet("README, .gitignore, license <b>ekleme</b> — zaten var"))
    s.append(bullet("<b>Create repository</b>"))

    s.append(Paragraph("13.2. Local repo'yu GitHub'a bağla", h3))
    s.append(Paragraph("GitHub sayfasında gösterilen komutları kopyala. Genelde:", small))
    s.append(cmd(
        "git remote add origin https://github.com/&lt;kullanıcı&gt;/yasemin-randevu-robotu.git<br/>"
        "git branch -M main<br/>"
        "git push -u origin main"
    ))
    s.append(success(
        "GitHub sayfasını yenile → dosyalar görünüyor. .env.local görünmemeli "
        "(.gitignore'da var)."
    ))

    s.append(PageBreak())

    # ─────────────── 14: ADIM 13 — VERCEL ───────────────
    s.append(Paragraph("14. Adım 13 — Vercel deploy", h2))

    s.append(Paragraph("14.1. Vercel'e repo import", h3))
    s.append(bullet("vercel.com → sağ üst <b>Add New → Project</b>"))
    s.append(bullet("GitHub'dan <b>yasemin-randevu-robotu</b> repo'sunu seç → <b>Import</b>"))
    s.append(bullet("Project name otomatik doluyor — istersen değiştir"))
    s.append(bullet("Framework Preset: <b>Next.js</b> (otomatik algılar)"))
    s.append(bullet("<b>Deploy'a BASMA!</b> Önce env vars eklemeliyiz (Adım 14)"))

    s.append(warning(
        "Vercel ilk deploy'ı env vars olmadan yapmaya kalkarsan build başarısız olur. "
        "Önce Environment Variables bölümünü doldur, sonra Deploy'a bas."
    ))

    s.append(PageBreak())

    # ─────────────── 15: ADIM 14 — VERCEL ENV VARS ───────────────
    s.append(Paragraph("15. Adım 14 — Vercel env vars", h2))

    s.append(Paragraph("15.1. Import ekranında doldur", h3))
    s.append(Paragraph(
        "Import sayfasında <b>Environment Variables</b> başlığı var. "
        ".env.local dosyandaki <b>her satırı</b> buraya ekle. Her biri için:",
        body
    ))
    s.append(bullet("<b>Key:</b> değişken adı (örn: AIRTABLE_API_KEY)"))
    s.append(bullet("<b>Value:</b> değer (.env.local'daki)"))
    s.append(bullet("<b>Add</b> → bir sonraki"))

    s.append(Paragraph("15.2. Kısa yol — toplu paste", h3))
    s.append(bullet("Vercel'in UI'ında alt kısımda 'Paste .env' seçeneği var"))
    s.append(bullet(".env.local'in tüm içeriğini <b>Ctrl+A Ctrl+C</b> → oraya paste"))
    s.append(bullet("Tüm key-value'lar otomatik doluyor"))

    s.append(Paragraph("15.3. Deploy", h3))
    s.append(bullet("<b>Deploy</b> butonuna bas"))
    s.append(bullet("Build log'ları akıyor — 1-3 dakika sürer"))
    s.append(bullet("Build başarılı olursa <b>Congratulations!</b> ekranı görünür"))
    s.append(bullet("Canlı URL: <b>yasemin-randevu-robotu.vercel.app</b> (sonek rastgele olabilir)"))

    s.append(warning(
        "Build başarısız olduysa: logs'u aç, son satırlardaki hatayı oku. "
        "En yaygın sebep: bir env var eksik kalmış veya typo var. "
        "Düzelt → Settings → Environment Variables'tan güncelle → Redeploy."
    ))

    s.append(PageBreak())

    # ─────────────── 16: ADIM 15 — CRON ───────────────
    s.append(Paragraph("16. Adım 15 — cron-job.org SMS cron", h2))
    s.append(Paragraph(
        "SMS hatırlatmaları cron ile tetikleniyor. Vercel Hobby planı "
        "günde 1 cron çalıştırıyor (yetmez) — bu yüzden dış servis "
        "<b>cron-job.org</b> kullanıyoruz (ücretsiz, 15 dk'da bir tetikler).",
        body
    ))

    s.append(Paragraph("16.1. Yeni cron job oluştur", h3))
    s.append(bullet("cron-job.org → giriş yap (ücretsiz hesap)"))
    s.append(bullet("<b>Create cronjob</b>"))
    s.append(bullet("Title: 'Yasemin SMS Reminders'"))
    s.append(bullet(
        "URL: <b>https://yasemin-randevu-robotu.vercel.app/api/send-reminders"
        "?secret=<u>CRON_SECRET değeri</u></b>"
    ))
    s.append(bullet("Schedule: Every 15 minutes"))
    s.append(bullet("<b>Create</b>"))

    s.append(warning(
        "URL'deki <b>secret</b> parametresi .env.local'deki CRON_SECRET ile "
        "<b>aynı</b> olmalı. Yanlışsa 403 döner, SMS gitmez."
    ))

    s.append(Paragraph("16.2. Manuel test", h3))
    s.append(cmd(
        "https://yasemin-randevu-robotu.vercel.app/api/send-reminders"
        "?secret=yasemin2026gizli"
    ))
    s.append(success(
        "Tarayıcıda açınca <b>200</b> ve JSON response gelir. "
        "'no reminders sent' veya gönderilen SMS sayısı."
    ))

    s.append(PageBreak())

    # ─────────────── 17: ADIM 16 — PRODUCTION SMOKE TEST ───────────────
    s.append(Paragraph("17. Adım 16 — Production smoke test", h2))
    s.append(Paragraph(
        "Canlı URL üzerinden tam akışı test et. Lokal çalışması canlıda "
        "çalışacağını garanti etmez (env vars, Vercel regionu, cold start).",
        body
    ))

    s.append(Paragraph("17.1. Public sayfa", h3))
    s.append(checkbox("https://yasemin-randevu-robotu.vercel.app/ yükleniyor"))
    s.append(checkbox("İşletme adı doğru görünüyor"))
    s.append(checkbox("Chat widget sağ altta var ve açılıyor"))

    s.append(Paragraph("17.2. Chat akışı (5 senaryo)", h3))
    s.append(checkbox("Senaryo 1: 'Yarın 15:00 manikür' → randevu oluşuyor (Airtable + GCal)"))
    s.append(checkbox("Senaryo 2: 'Randevumu iptal et' → bulup iptal ediyor"))
    s.append(checkbox("Senaryo 3: 'Tarihi değiştir' → eski sil + yeni oluştur"))
    s.append(checkbox("Senaryo 4: 'Hangi personel X yapıyor' → listeyi söylüyor"))
    s.append(checkbox("Senaryo 5: 'X kaç para' → config'deki fiyatı söylüyor"))

    s.append(Paragraph("17.3. Dashboard", h3))
    s.append(checkbox("/dashboard → Clerk sign-in sayfası"))
    s.append(checkbox("Müşteri email + şifresi ile giriş OK"))
    s.append(checkbox("Randevu listesi görünüyor"))
    s.append(checkbox("Kazanç kartları doğru TL gösteriyor"))

    s.append(Paragraph("17.4. Cron endpoint", h3))
    s.append(checkbox("Cron URL tarayıcıda 200 dönüyor"))
    s.append(checkbox("cron-job.org → History'de son run başarılı"))

    s.append(success(
        "Tüm kutular ✓ ise production canlıda, hazır. Müşteriye teslim "
        "edilebilir (Adım 17)."
    ))

    s.append(PageBreak())

    # ─────────────── 18: ADIM 17 — MÜŞTERİYE TESLİM ───────────────
    s.append(Paragraph("18. Adım 17 — Müşteriye teslim", h2))
    s.append(Paragraph(
        "Müşteriye bir paket hazırla — mail veya WhatsApp ile gönder:",
        body
    ))

    s.append(Paragraph("18.1. Teslim paketi", h3))
    s.append(bullet("<b>Canlı URL:</b> https://yasemin-randevu-robotu.vercel.app"))
    s.append(bullet("<b>Dashboard giriş:</b> /dashboard → email + şifre (ilk girişte değiştirmesini söyle)"))
    s.append(bullet("<b>Chat linki:</b> ana sayfada zaten var; Instagram bio'ya eklemesini öner"))
    s.append(bullet("<b>SMS numarası:</b> hangi numaradan SMS gideceğini söyle"))
    s.append(bullet("<b>SISTEM-REHBERI.pdf:</b> dashboard nasıl kullanılır, randevu ekleme/iptal — ver"))

    s.append(Paragraph("18.2. Müşteriye eğitim", h3))
    s.append(bullet("30 dk görüntülü → dashboard gezintisi, randevu ekleme, no-show işaretleme"))
    s.append(bullet("Chat widget'ın Instagram'a nasıl paylaşılacağını göster"))
    s.append(bullet("Soru gelirse nereden ulaşacağını söyle"))

    s.append(PageBreak())

    # ─────────────── 19: EN KOLAY YOL ───────────────
    s.append(Paragraph("19. En Kolay Yol (Speed-Run)", h2))
    s.append(Paragraph(
        "Yukarıdaki detaylı yolun <b>her adımını</b> bilir hale geldikten "
        "sonra şu sıra ile yapınca 30-45 dk'a iner:",
        body
    ))
    speed = [
        ["1.", "Bella klasörünü kopyala, node_modules/.next/.git sil, ismini değiştir"],
        ["2.", "VS Code'da aç, terminal: <b>git init && git add . && git commit -m init && git branch -M main</b>"],
        ["3.", "config/client.ts → 4 alan (businessName, assistantName, emoji, services, workingHours)"],
        ["4.", "app/layout.tsx → title + description"],
        ["5.", "Airtable: Bella base'ini <b>Duplicate base</b> → şema hazır, sadece Staff'ı boşalt"],
        ["6.", "Google Calendar: yeni takvim oluştur, ID'yi kopyala"],
        ["7.", "Clerk: new app → publishable + secret key"],
        ["8.", ".env.local → yeni değerleri yaz (3-4 alan değişir)"],
        ["9.", "<b>npm install && npm run dev</b> → lokal test"],
        ["10.", "GitHub private repo oluştur, push"],
        ["11.", "Vercel → Import → .env.local'i Paste → Deploy"],
        ["12.", "cron-job.org → new job → /api/send-reminders?secret=..."],
        ["13.", "Canlı URL'de 5 chat senaryosunu test et"],
        ["14.", "Müşteriye canlı URL + dashboard bilgileri"],
    ]
    s.append(steps_table(speed))

    s.append(Paragraph("En büyük hızlandırıcı", h3))
    s.append(warning(
        "<b>Airtable base'ini duplicate etmek</b> en büyük zaman kazandırıcı. "
        "airtable.com/<base-link> → sağ üst 3 nokta → <b>Duplicate base</b>. "
        "Şema, alan adları, single select seçenekleri hepsi hazır geliyor. "
        "Sadece kayıtları temizleyip Staff'a müşterinin personelini girmen yeterli."
    ))

    s.append(PageBreak())

    # ─────────────── 20: MASTER CHECKLIST ───────────────
    s.append(Paragraph("20. Master Checklist — Yazdır, İşaretle", h2))
    s.append(Paragraph(
        "Her yeni müşteride bu tek sayfayı yazdır. Her adımı bitirdikçe "
        "kutusuna ✓ at.",
        tagline
    ))

    s.append(Paragraph("Bilgi toplama", h3))
    s.append(checkbox("İşletme adı + bot ismi + emoji"))
    s.append(checkbox("Çalışma saatleri + günleri"))
    s.append(checkbox("Hizmet listesi (isim, süre, fiyat)"))
    s.append(checkbox("Personel listesi (isim, rol, hizmetler)"))

    s.append(Paragraph("Proje klonlama", h3))
    s.append(checkbox("Bella klasörü kopyalandı, ismi değişti"))
    s.append(checkbox("node_modules, .next, .git silindi"))
    s.append(checkbox("VS Code açıldı"))
    s.append(checkbox("git init + initial commit"))

    s.append(Paragraph("Kod kişiselleştirme", h3))
    s.append(checkbox("config/client.ts güncellendi (4 alan)"))
    s.append(checkbox("app/layout.tsx title + description güncellendi"))
    s.append(checkbox("npx tsc --noEmit hatasız"))

    s.append(Paragraph("Harici servisler", h3))
    s.append(checkbox("Airtable base oluşturuldu (Randevular + Staff)"))
    s.append(checkbox("Airtable API key + base ID alındı"))
    s.append(checkbox("Google Calendar yeni takvim oluşturuldu, ID alındı"))
    s.append(checkbox("Clerk yeni app + müşteri hesabı"))
    s.append(checkbox("Clerk publishable + secret key alındı"))
    s.append(checkbox("Twilio seçimi yapıldı (A: paylaş, B: yeni)"))
    s.append(checkbox("Anthropic key seçimi (A: paylaş, B: yeni)"))

    s.append(Paragraph("Env vars", h3))
    s.append(checkbox(".env.local tüm 14+ değişken dolu"))
    s.append(checkbox("CRON_SECRET rastgele + müşteriye özel"))

    s.append(Paragraph("Test + deploy", h3))
    s.append(checkbox("npm install başarılı"))
    s.append(checkbox("npm run dev → lokal test (chat + dashboard + airtable + gcal)"))
    s.append(checkbox("GitHub private repo oluşturuldu, push edildi"))
    s.append(checkbox("Vercel import + env vars paste + deploy"))
    s.append(checkbox("cron-job.org yeni cron eklendi"))
    s.append(checkbox("Canlı URL'de 5 chat senaryosu yeşil"))
    s.append(checkbox("Dashboard canlı URL'de çalışıyor"))
    s.append(checkbox("Cron endpoint 200 dönüyor"))

    s.append(Paragraph("Teslim", h3))
    s.append(checkbox("Canlı URL + giriş bilgileri müşteriye iletildi"))
    s.append(checkbox("SISTEM-REHBERI.pdf gönderildi"))
    s.append(checkbox("30 dk eğitim yapıldı"))
    s.append(checkbox("Destek kanalı (WhatsApp/mail) söylendi"))

    s.append(PageBreak())

    # ─────────────── 21: SORUN GİDERME ───────────────
    s.append(Paragraph("21. Sık Karşılaşılan Hatalar + Çözüm", h2))

    troubles = [
        ("Build hatası: Airtable env var missing",
         "Vercel → Settings → Environment Variables kontrol. "
         "Tüm AIRTABLE_* değişkenleri dolu mu? Redeploy gerekir."),
        ("Chat cevap vermiyor, 500 hatası",
         "Anthropic API key yanlış veya quota dolu. console.anthropic.com → "
         "Usage kontrol. Key'i .env.local + Vercel'de güncelle."),
        ("Randevu Airtable'a düşmüyor",
         "(1) AIRTABLE_BASE_ID doğru mu? (2) Tablo adı tam 'Randevular' mı? "
         "(3) API token'ın bu base'e yazma izni var mı? "
         "(4) Alan adları <b>büyük-küçük harf duyarlı</b>."),
        ("Google Calendar'a event oluşmuyor",
         "GOOGLE_REFRESH_TOKEN süresi dolmuş olabilir. "
         "OAuth playground'dan yeni token üret. "
         "Veya GOOGLE_CALENDAR_ID yazım yanlışı."),
        ("SMS gitmiyor",
         "(1) TWILIO env vars doğru mu? (2) cron-job.org → History son "
         "çalıştırma başarılı mı? (3) Twilio dashboard → Logs → hata var mı? "
         "(4) Trial account'larda sadece <b>doğrulanmış numaralara</b> SMS gider."),
        ("Dashboard açılmıyor — 404 sign-in",
         "Clerk env vars eksik/yanlış. PUBLISHABLE ve SECRET KEY'i "
         "tekrar kopyala. middleware.ts var olmalı."),
        ("Bot yanlış hizmetleri öneriyor",
         "config/client.ts ile Airtable Staff.services multiselect "
         "seçenekleri tutuyor mu? İsimler tam aynı olmalı."),
        ("Cron 403 forbidden",
         "URL'deki ?secret= parametresi CRON_SECRET ile eşleşmiyor. "
         "Kontrol et."),
        ("Timezone hatası: SMS 3 saat erken/geç",
         "lib/calendar.ts veya send-reminders/route.ts içinde Istanbul "
         "offset (+03:00) eksik. bella-timezone-guard skill'ine bak."),
        ("npm install hatası",
         "Node.js sürümü >=20 olmalı. node --version kontrol et. "
         "Gerekirse nvm ile güncelle."),
    ]
    for title, solution in troubles:
        s.append(Paragraph(f"<b>Sorun:</b> {title}", h4))
        s.append(Paragraph(f"<b>Çözüm:</b> {solution}", body))

    s.append(Spacer(1, 6 * mm))
    s.append(Paragraph(
        "Çözüm bulunamazsa: Bella projesinin Vercel logs'u ile karşılaştır "
        "— aynı endpoint'te Bella'da ne dönüyorsa Yasemin'de de aynısı "
        "dönmeli.",
        small
    ))

    s.append(Spacer(1, 8 * mm))
    s.append(Paragraph(
        "Hazırlayan: Bella Randevu Robotu · Tarih: 2026-04-21 · Sürüm: v1",
        small
    ))

    doc.build(s)
    print(f"PDF oluşturuldu: {output_path}")


if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "YENI-MUSTERI-ONBOARDING.pdf")
    build_pdf(out)
