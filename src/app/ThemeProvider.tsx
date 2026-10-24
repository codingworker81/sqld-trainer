import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSettings, saveSettings, type ThemeSetting } from '../db';

export type { ThemeSetting };

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
  // Stage 4: 설정은 Dexie(settings 테이블)에 저장된다. 로드 전까지는
  // 기본값(system)으로 렌더링하고, 불러온 뒤 실제 값으로 갱신한다.
  const [theme, setThemeState] = useState<ThemeSetting>('system');
  const [prefersDark, setPrefersDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );

  useEffect(() => {
    let cancelled = false;
    getSettings().then((settings) => {
      if (!cancelled) setThemeState(settings.theme);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolveIsDark(theme, prefersDark));
  }, [theme, prefersDark]);

  const setTheme = (next: ThemeSetting) => {
    setThemeState(next);
    void saveSettings({ theme: next });
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
