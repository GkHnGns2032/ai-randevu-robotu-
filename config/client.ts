// config/client.ts
// ─────────────────────────────────────────────────────────────
// Yeni müşteri için sadece bu dosyayı ve .env.local'i düzenle.
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
