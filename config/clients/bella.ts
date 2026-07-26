// config/clients/bella.ts
// ─────────────────────────────────────────────────────────────
// Bella Güzellik Salonu — tenant config (Yol A, Aşama 0-1).
// Yeni tenant için: bu dosyayı kopyala, slug değiştir, config/client.ts wrapper map'ine ekle.
// ─────────────────────────────────────────────────────────────

export const CLIENT_CONFIG = {
  // İşletme bilgileri
  businessName: 'Bella Güzellik Salonu',
  assistantName: 'Bella',
  welcomeEmoji: '💇‍♀️',

  // Hizmetler — isim, süre (dk), fiyat (₺)
  services: [
    { name: 'Saç Kesimi',    duration: 45,  price: 350  },
    { name: 'Saç Boyama',    duration: 120, price: 950  },
    { name: 'Manikür',       duration: 60,  price: 280  },
    { name: 'Pedikür',       duration: 60,  price: 320  },
    { name: 'Kaş Tasarımı',  duration: 30,  price: 220  },
    { name: 'Cilt Bakımı',   duration: 90,  price: 650  },
    { name: 'Masaj',         duration: 60,  price: 500  },
    { name: 'Kalıcı Makyaj', duration: 120, price: 1600 },
  ] as const,

  // ── Marka ──────────────────────────────────────────────────
  // Müşteriye bakan yüzeyin (landing + chat) renkleri ve fontları.
  // Buradaki her anahtar app/globals.css'teki --c-* varsayılanını ezer;
  // yazmadığın anahtar varsayılanda kalır, yani hepsini doldurmak şart değil.
  // Operatör panelinin 8 paleti bundan bağımsızdır (panelde kullanıcı seçer);
  // yalnız `dashboardTheme` ile o panelin AÇILIŞ paleti belirlenir.
  brand: {
    brand: '#7B5EA7',              // birincil marka rengi (butonlar, vurgular)
    brandStrong: '#6B3FA0',        // koyu varyant (slot butonu metni)
    brandInk: '#3A2855',           // marka tonlu koyu metin (baloncuk metni)
    brandSoft: '#EBE2F5',          // kullanıcı baloncuğu zemini
    brandTint: '#DDD0F0',          // ince kenarlıklar
    brandTintStrong: '#C9ADE0',    // seçili slot kenarlığı
    brandMuted: '#6B5080',         // çip metni
    brandSubtle: '#8B7B95',        // küçük büyük-harf metin
    brandRgb: '123, 94, 167',      // rgba() gölgeler için — brand ile uyumlu tut

    pageFrom: '#FDFCF9',           // sayfa radial gradyan içi
    pageTo: '#F5EEE8',             // sayfa radial gradyan dışı + input şeridi
    surface: '#FDFCF9',            // sohbet kartı zemini
    surfaceRaised: '#FFFFFF',      // baloncuk / çip zemini
    border: '#EDE4DA',
    borderSoft: '#F0E8DF',

    heading: '#2A2018',
    textMuted: '#8A7A70',
    textChip: '#5A4A40',
    textFaint: '#C8BAB0',

    online: '#9EC9A8',             // çevrimiçi noktası + başarı kenarlığı
    dots: '#C8B8D0',               // "yazıyor" noktaları

    avatarFrom: '#F0E8F5',
    avatarTo: '#F7E2EC',
    avatarBorder: '#EDD8E8',

    chipBg: '#FAF8FE',
    chipBorder: '#D8CEEA',
    chipBgHover: '#F0EAF8',
    chipBorderHover: '#B8A0E0',

    confetti1: '#EBE2F5',
    confetti2: '#F7E2EC',
    confetti3: '#C4AEE0',
    confetti4: '#FFFFFF',

    fontSerif: "'Cormorant Garamond', serif",
    fontSans: "'DM Sans', sans-serif",

    dashboardTheme: 'obsidian',    // panelin açılış paleti
  },

  // Çalışma saatleri
  workingHours: {
    start: 9,           // 09:00
    end: 19,            // 19:00
    slotMinutes: 30,    // 30 dk'lık slotlar
    workingDays: [1, 2, 3, 4, 5, 6] as number[], // 0=Pazar, 1=Pzt … 6=Cmt
    workingDaysLabel: 'Pazartesi-Cumartesi',
  },
};

// ServiceType: config'den otomatik türetilir, elle değiştirme
export type ServiceName = (typeof CLIENT_CONFIG.services)[number]['name'];
