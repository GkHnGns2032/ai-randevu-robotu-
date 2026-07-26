'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DASHBOARD_THEMES, defaultDashboardTheme } from '@/lib/brand';

export type ThemeName = (typeof DASHBOARD_THEMES)[number];

interface ThemeCtx { theme: ThemeName; setTheme: (t: ThemeName) => void; }

const Ctx = createContext<ThemeCtx>({ theme: 'obsidian', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Açılış paleti artık app/layout.tsx'teki bootstrap script'i tarafından
  // ilk boyamadan önce <html data-theme> üzerine yazılıyor. Buradaki state
  // yalnız PalettePicker'ın hangi swatch'in seçili olduğunu bilmesi için.
  const [theme, setThemeState] = useState<ThemeName>(defaultDashboardTheme());

  useEffect(() => {
    // Script'in yazdığı gerçek değeri al — localStorage'ı tekrar okumaya gerek yok.
    const applied = document.documentElement.getAttribute('data-theme') as ThemeName | null;
    if (applied && DASHBOARD_THEMES.includes(applied)) setThemeState(applied);
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('bella-theme', t);
  };

  return (
    <Ctx.Provider value={{ theme, setTheme }}>
      {/* data-theme burada YOK: <html> üzerinde ve ilk boyamada doğru.
          Burada tekrar basmak, React state güncellenene kadar eski paleti
          dayatıp FOUC'u geri getiriyordu. */}
      <div className="theme-root theme-transition">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
