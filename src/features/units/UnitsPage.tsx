import { useState } from 'react';
import { useUnitsData } from './useUnitsData';
import { UnitCard } from './UnitCard';
import { FilterModal } from './FilterModal';

export default function UnitsPage() {
  const rows = useUnitsData();
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">단원 목록</h1>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
        >
          필터 학습
        </button>
      </div>
      {!rows ? (
        <p className="mt-6 text-slate-500 dark:text-slate-400">불러오는 중…</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <UnitCard key={row.unit.id} {...row} />
          ))}
        </div>
      )}
      {filterOpen && rows && (
        <FilterModal units={rows.map((r) => r.unit)} onClose={() => setFilterOpen(false)} />
      )}
    </div>
  );
}
