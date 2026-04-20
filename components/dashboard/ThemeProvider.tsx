'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeName = 'obsidian' | 'ivory' | 'rose' | 'ocean' | 'emerald' | 'amethyst' | 'beige' | 'midnight';

interface ThemeCtx { theme: ThemeName; setTheme: (t: ThemeName) => void; }

const Ctx = createContext<ThemeCtx>({ theme: 'obsidian', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('obsidian');

  useEffect(() => {
    const s = localStorage.getItem('bella-theme') as ThemeName | null;
    const valid: ThemeName[] = ['obsidian','ivory','rose','ocean','emerald','amethyst','beige','midnight'];
    if (s && valid.includes(s)) setThemeState(s);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem('bella-theme', t);
  };

  return (
    <Ctx.Provider value={{ theme, setTheme }}>
      <div data-theme={theme} className="theme-root theme-transition">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
