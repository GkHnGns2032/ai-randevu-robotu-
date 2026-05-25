import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Bella Güzellik Salonu — Online Randevu',
  description: 'Yapay zeka destekli randevu sistemi ile 7/24 randevu alın',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="tr">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
