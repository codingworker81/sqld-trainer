import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeSetting = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeSetting;
  setTheme: (theme: ThemeSetting) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveIsDark(theme: ThemeSetting, prefersDark: boolean): boolean {
  if (theme === 'system') return prefersDark;
  return theme === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Stage 1: in-memory only. Persisted to Dexie settings from Stage 4 onward.
  const [theme, setTheme] = useState<ThemeSetting>('system');
  const [prefersDark, setPrefersDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolveIsDark(theme, prefersDark));
  }, [theme, prefersDark]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
