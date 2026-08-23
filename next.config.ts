import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Dev sunucusu ile üretim derlemesi AYNI dizini paylaşmaz.
  //
  // Neden: `next dev` koşarken `npm run build` çalıştırmak `.next`i baştan
  // yazıyor ve koşan dev sunucusunun servis ettiği varlıkları (CSS dahil)
  // yok ediyor. Sonuç sessiz ve aldatıcı: sayfa AÇILIYOR ama stilsiz —
  // uygulama bozulmuş gibi görünüyor, oysa bozulan yalnız önbellek.
  // 23 Ağu 2026'da iki kez yaşandı; ikisinde de önce ürün arızası sanıldı.
  // Saha demosu açıkken biri derleme koşarsa MÜŞTERİNİN ÖNÜNDE olur.
  //
  // `npm run dev` → `.next-dev` · `npm run build` → `.next`. Çakışma imkânsız.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
