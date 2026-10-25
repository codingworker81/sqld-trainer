import { useUnitsData } from './useUnitsData';
import { UnitCard } from './UnitCard';

export default function UnitsPage() {
  const rows = useUnitsData();

  return (
    <div>
      <h1 className="text-xl font-bold">단원 목록</h1>
      {!rows ? (
        <p className="mt-6 text-slate-500 dark:text-slate-400">불러오는 중…</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <UnitCard key={row.unit.id} {...row} />
          ))}
        </div>
      )}
    </div>
  );
}
