import { useNavigate } from 'react-router-dom';
import type { NoteCardRow } from './useNotesData';
import { setPendingCardIds } from '../study/pendingSession';

const RESULT_LABEL: Record<string, string> = { again: '틀림', hard: '헷갈림', good: '맞힘' };

function summarize(front: string): string {
  const oneLine = front.replace(/\s+/g, ' ').trim();
  return oneLine.length > 50 ? `${oneLine.slice(0, 50)}…` : oneLine;
}

export function NoteList({ rows, emptyText }: { rows: NoteCardRow[]; emptyText: string }) {
  const navigate = useNavigate();

  function handleStartStudy() {
    setPendingCardIds(rows.map((r) => r.card.id));
    navigate('/study?mode=custom');
  }

  if (rows.length === 0) {
    return <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleStartStudy}
        className="mt-4 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
      >
        이 목록 학습 ({rows.length}장)
      </button>

      <ul className="mt-3 flex flex-col gap-2">
        {rows.map(({ card, unitTitle, box, lastResult }) => (
          <li
            key={card.id}
            className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"
          >
            <p className="text-slate-800 dark:text-slate-100">{summarize(card.front)}</p>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{unitTitle}</span>
              <span>·</span>
              <span>Box {box}</span>
              {lastResult && (
                <>
                  <span>·</span>
                  <span>{RESULT_LABEL[lastResult]}</span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
