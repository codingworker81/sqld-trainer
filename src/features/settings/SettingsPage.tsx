import { useTheme, type ThemeSetting } from '../../app/ThemeProvider';

const themeOptions: { value: ThemeSetting; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h1 className="text-xl font-bold">설정</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">테마</h2>
        <div className="mt-2 flex gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={theme === opt.value}
              className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                theme === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400'
                  : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          현재는 이 세션에서만 적용됩니다. Stage 4부터 기기에 저장됩니다.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">시험일 · 신규 카드 상한 · 세션 길이 · 백업</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Stage 6에서 구현됩니다.</p>
      </section>
    </div>
  );
}
