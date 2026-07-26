import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { CLIENT_CONFIG } from '@/config/client';
import { brandStyle, defaultDashboardTheme, DASHBOARD_THEMES } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${CLIENT_CONFIG.businessName} — Online Randevu`,
  description: 'Yapay zeka destekli randevu sistemi ile 7/24 randevu alın',
};

const initialTheme = defaultDashboardTheme();

/**
 * Panel paletini İLK BOYAMADAN ÖNCE <html>'e yazar.
 * Öncesinde ThemeProvider paleti mount sonrası localStorage'dan okuyordu:
 * "ivory" (açık) seçmiş bir kullanıcı her yüklemede önce koyu temayı görüp
 * 350ms'lik geçişle açık temaya dönüyordu. Bu script o pencereyi kapatır.
 */
const themeBootstrap = `(function(){try{var t=localStorage.getItem('bella-theme');var v=${JSON.stringify(
  DASHBOARD_THEMES,
)};document.documentElement.setAttribute('data-theme',v.indexOf(t)>-1?t:'${initialTheme}')}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      {/* suppressHydrationWarning: data-theme'i yukarıdaki script hydration
          öncesi değiştirebilir — beklenen davranış, uyarı bastırılır. */}
      <html lang="tr" data-theme={initialTheme} style={brandStyle()} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
