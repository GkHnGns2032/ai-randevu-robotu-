// config/clients/demo.ts
// ─────────────────────────────────────────────────────────────
// ÖRNEK TENANT — gerçek müşteri değil.
//
// İki işi var:
//  1. Yeni müşteri onboarding'i için kopyalanacak şablon
//  2. Marka katmanının gerçekten çalıştığının kanıtı — tek dosya değişince
//     müşteriye bakan yüzeyin tüm rengi/kimliği değişiyor mu
//
// Kullanım: NEXT_PUBLIC_CLIENT_ID=demo npm run dev
// ─────────────────────────────────────────────────────────────

export const CLIENT_CONFIG = {
  businessName: 'Deniz Estetik Merkezi',
  assistantName: 'Deniz',
  welcomeEmoji: '🌊',

  services: [
    { name: 'Saç Kesimi',    duration: 45,  price: 400  },
    { name: 'Saç Boyama',    duration: 120, price: 1100 },
    { name: 'Manikür',       duration: 60,  price: 320  },
    { name: 'Pedikür',       duration: 60,  price: 360  },
    { name: 'Kaş Tasarımı',  duration: 30,  price: 250  },
    { name: 'Cilt Bakımı',   duration: 90,  price: 750  },
    { name: 'Masaj',         duration: 60,  price: 600  },
    { name: 'Kalıcı Makyaj', duration: 120, price: 1800 },
  ] as const,

  // Marka — Bella'nın mor/krem'i yerine okyanus mavisi/buz.
  // Yazılmayan her anahtar globals.css :root varsayılanında kalır.
  brand: {
    brand: '#1E6F8C',
    brandStrong: '#124F66',
    brandInk: '#0E2E3D',
    brandSoft: '#D6ECF3',
    brandTint: '#B8DCE8',
    brandTintStrong: '#7FC0D6',
    brandMuted: '#2A6076',
    brandSubtle: '#6B8A96',
    brandRgb: '30, 111, 140',

    pageFrom: '#FBFDFE',
    pageTo: '#E6F1F5',
    surface: '#FBFDFE',
    surfaceRaised: '#FFFFFF',
    border: '#D8E6EC',
    borderSoft: '#E4EFF3',

    heading: '#0F2630',
    textMuted: '#6B8A96',
    textChip: '#3D5B66',
    textFaint: '#AFC3CC',

    online: '#5FBFA8',
    dots: '#A8C6D2',

    avatarFrom: '#DCEEF5',
    avatarTo: '#CFE9E4',
    avatarBorder: '#BEDCE6',

    chipBg: '#F5FBFD',
    chipBorder: '#C9E2EC',
    chipBgHover: '#E8F5FA',
    chipBorderHover: '#8FC5DA',

    confetti1: '#D6ECF3',
    confetti2: '#CFE9E4',
    confetti3: '#7FC0D6',
    confetti4: '#FFFFFF',

    dashboardTheme: 'ocean',
  },

  workingHours: {
    start: 10,
    end: 20,
    slotMinutes: 30,
    workingDays: [1, 2, 3, 4, 5, 6] as number[],
    workingDaysLabel: 'Pazartesi-Cumartesi',
  },
};

export type ServiceName = (typeof CLIENT_CONFIG.services)[number]['name'];
