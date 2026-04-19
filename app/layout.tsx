import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Randevu Robotu - Güzellik Salonu",
  description: "Yapay zeka destekli randevu yönetim sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <ClerkProvider afterSignOutUrl="/">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
