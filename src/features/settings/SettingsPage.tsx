import { useEffect, useState } from 'react';
import { useTheme, type ThemeSetting } from '../../app/ThemeProvider';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../../db';
import { BackupSection } from './BackupSection';
import { exportErrorReports } from './errorReportActions';

const themeOptions: { value: ThemeSetting; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [examDate, setExamDate] = useState(DEFAULT_SETTINGS.examDate);
  const [newCardLimit, setNewCardLimit] = useState(DEFAULT_SETTINGS.newCardLimit);
  const [sessionSize, setSessionSize] = useState(DEFAULT_SETTINGS.sessionSize);
  const [errorReportStatus, setErrorReportStatus] = useState('');

  async function handleExportErrorReports() {
    const count = await exportErrorReports();
    setErrorReportStatus(count > 0 ? `${count}건을 내보냈습니다.` : '신고된 오류가 없습니다.');
  }

  useEffect(() => {
    let cancelled = false;
    getSettings().then((settings) => {
      if (cancelled) return;
      setExamDate(settings.examDate);
      setNewCardLimit(settings.newCardLimit);
      setSessionSize(settings.sessionSize);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      </section>

      <section className="mt-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">학습 설정</h2>

        <label className="block">
          <span className="text-sm text-slate-700 dark:text-slate-200">시험일</span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => {
              setExamDate(e.target.value);
              void saveSettings({ examDate: e.target.value });
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-700 dark:text-slate-200">하루 신규 카드 상한</span>
          <input
            type="number"
            min={1}
            value={newCardLimit}
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value) || 1);
              setNewCardLimit(value);
              void saveSettings({ newCardLimit: value });
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-700 dark:text-slate-200">세션 길이(카드 수)</span>
          <input
            type="number"
            min={1}
            value={sessionSize}
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value) || 1);
              setSessionSize(value);
              void saveSettings({ sessionSize: value });
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      </section>

      <BackupSection />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">콘텐츠 오류 신고</h2>
        <button
          type="button"
          onClick={() => void handleExportErrorReports()}
          className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
        >
          오류 신고 카드 목록 내보내기
        </button>
        {errorReportStatus && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{errorReportStatus}</p>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
        SQLD 2과목 암기 v{__APP_VERSION__}
      </p>
    </div>
  );
}
