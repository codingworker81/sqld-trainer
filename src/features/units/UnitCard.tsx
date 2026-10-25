import { Link } from 'react-router-dom';
import type { UnitRow } from './useUnitsData';
import { WEIGHT_LABEL, WEIGHT_BADGE_CLASS } from './weightMeta';

export function UnitCard({ unit, masteryPercent, learnedCount, totalCount }: UnitRow) {
  const hasCards = totalCount > 0;

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-sm font-semibold text-slate-400">{unit.no}</span>
          <h2 className="truncate font-semibold">{unit.title}</h2>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${WEIGHT_BADGE_CLASS[unit.weight]}`}>
          {WEIGHT_LABEL[unit.weight]}
        </span>
      </div>

      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${masteryPercent}%` }}
            role="progressbar"
            aria-valuenow={masteryPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>숙련도 {masteryPercent}%</span>
          <span>
            {learnedCount}/{totalCount}장
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link
          to={hasCards ? `/study?mode=unit&unitId=${unit.id}` : '#'}
          aria-disabled={!hasCards}
          className={`flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-medium ${
            hasCards
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'pointer-events-none bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
          }`}
        >
          학습
        </Link>
        <Link
          to={`/units/${unit.id}/summary`}
          className="flex min-h-11 items-center justify-center rounded-lg bg-slate-100 px-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          요약노트
        </Link>
        <button
          type="button"
          disabled
          className="flex min-h-11 items-center justify-center rounded-lg bg-slate-50 px-2 text-sm font-medium text-slate-300 dark:bg-slate-900 dark:text-slate-700"
        >
          퀴즈
        </button>
      </div>
    </div>
  );
}
