import { Link, useNavigate } from 'react-router-dom';
import { SettingsIcon } from '../../components/layout/icons';
import { useHomeData } from './useHomeData';

function dDayLabel(daysUntilExam: number): string {
  if (daysUntilExam === 0) return 'D-DAY';
  if (daysUntilExam > 0) return `D-${daysUntilExam}`;
  return `D+${Math.abs(daysUntilExam)}`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const data = useHomeData();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">홈</h1>
        <Link
          to="/settings"
          aria-label="설정"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <SettingsIcon className="h-6 w-6" />
        </Link>
      </div>

      {!data ? (
        <p className="mt-6 text-slate-500 dark:text-slate-400">불러오는 중…</p>
      ) : (
        <>
          <p className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            {dDayLabel(data.daysUntilExam)} · 시험일 {data.examDate}
          </p>

          <button
            type="button"
            onClick={() => navigate('/study?mode=daily')}
            className="mt-4 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-4 text-left text-white hover:bg-blue-700"
          >
            <div className="text-lg font-bold">오늘의 복습 {data.reviewCount + data.newCount}장 시작</div>
            <div className="mt-1 text-sm text-blue-50">
              복습 {data.reviewCount} · 신규 {data.newCount}
            </div>
          </button>

          {data.showExamModeSlot && (
            <button
              type="button"
              disabled
              className="mt-3 min-h-11 w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500"
            >
              시험 모드 (Stage 10에서 제공 예정)
            </button>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat label="전체 숙련도" value={`${data.overallMasteryPercent}%`} />
            <Stat label="함정 숙련도" value={`${data.trapMasteryPercent}%`} />
            <Stat label="연속 학습일" value={`${data.streak}일`} />
            <Stat label="오늘 학습량" value={`${data.todayStudiedCount}장`} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
