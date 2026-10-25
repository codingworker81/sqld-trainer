import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSettings, saveSettings, type ThemeSetting } from '../db';

export type { ThemeSetting };

interface ThemeContextValue {
  theme: ThemeSetting;
  setTheme: (theme: ThemeSetting) => void;
  /** theme='system'일 때 실제로 적용 중인 값. 구문 강조처럼 라이트/다크
   * 둘 중 하나를 직접 골라야 하는 곳에서 쓴다. */
  resolvedTheme: 'light' | 'dark';
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

  const isDark = resolveIsDark(theme, prefersDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const setTheme = (next: ThemeSetting) => {
    setThemeState(next);
    void saveSettings({ theme: next });
  };

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme: (isDark ? 'dark' : 'light') as 'light' | 'dark' }),
    [theme, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
