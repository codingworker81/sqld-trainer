import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCards } from '../../content';
import { getAllStates } from '../../db';
import { filterCards, type CardFilter } from '../../engine/filter';
import { setPendingCardIds } from '../study/pendingSession';
import { CARD_TYPE_LABEL } from '../study/cardTypeMeta';
import type { Card, CardType, Unit } from '../../content/schema';
import type { LeitnerState } from '../../engine/types';

const TAG_OPTIONS: { value: Card['tags'][number]; label: string }[] = [
  { value: 'trap', label: '⚠️ 함정' },
  { value: 'mssql', label: 'SQL Server' },
];

const TYPE_OPTIONS = Object.keys(CARD_TYPE_LABEL) as CardType[];

const BOX_OPTIONS = [0, 1, 2, 3, 4, 5];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterModal({ units, onClose }: { units: Unit[]; onClose: () => void }) {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [states, setStates] = useState<Record<string, LeitnerState>>({});
  const [tags, setTags] = useState<Card['tags'][number][]>([]);
  const [types, setTypes] = useState<CardType[]>([]);
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [boxMin, setBoxMin] = useState<number | undefined>(undefined);
  const [boxMax, setBoxMax] = useState<number | undefined>(undefined);

  useEffect(() => {
    setCards(getAllCards());
    void getAllStates().then(setStates);
  }, []);

  const filter: CardFilter = useMemo(
    () => ({ tags, types, unitIds, boxMin: boxMin as LeitnerState['box'] | undefined, boxMax: boxMax as LeitnerState['box'] | undefined }),
    [tags, types, unitIds, boxMin, boxMax],
  );

  const matched = useMemo(() => filterCards(cards, states, filter), [cards, states, filter]);

  function handleStart() {
    setPendingCardIds(matched.map((c) => c.id));
    navigate('/study?mode=custom');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="필터 학습"
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-slate-900 sm:max-w-md sm:rounded-2xl"
      >
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">필터 학습</h2>

        <section className="mt-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">태그</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TAG_OPTIONS.map((opt) => (
              <Chip key={opt.value} active={tags.includes(opt.value)} onClick={() => setTags(toggle(tags, opt.value))}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className="mt-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">카드 유형</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((t) => (
              <Chip key={t} active={types.includes(t)} onClick={() => setTypes(toggle(types, t))}>
                {CARD_TYPE_LABEL[t]}
              </Chip>
            ))}
          </div>
        </section>

        <section className="mt-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Box 구간</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <select
              aria-label="Box 최소"
              value={boxMin ?? ''}
              onChange={(e) => setBoxMin(e.target.value === '' ? undefined : Number(e.target.value))}
              className="min-h-11 rounded-lg border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">전체</option>
              {BOX_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  Box {b}
                </option>
              ))}
            </select>
            <span className="text-slate-400">~</span>
            <select
              aria-label="Box 최대"
              value={boxMax ?? ''}
              onChange={(e) => setBoxMax(e.target.value === '' ? undefined : Number(e.target.value))}
              className="min-h-11 rounded-lg border border-slate-200 px-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">전체</option>
              {BOX_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  Box {b}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">단원</p>
          <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {units.map((u) => (
              <Chip key={u.id} active={unitIds.includes(u.id)} onClick={() => setUnitIds(toggle(unitIds, u.id))}>
                {u.title}
              </Chip>
            ))}
          </div>
        </section>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            취소
          </button>
          <button
            type="button"
            disabled={matched.length === 0}
            onClick={handleStart}
            className="min-h-11 flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {matched.length}장 학습 시작
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3 py-1.5 text-sm ${
        active
          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400'
          : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
