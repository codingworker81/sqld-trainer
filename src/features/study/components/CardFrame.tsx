import type { ReactNode } from 'react';
import type { Card, Unit } from '../../../content/schema';
import { CARD_TYPE_LABEL } from '../cardTypeMeta';
import { CardNoteActions } from './CardNoteActions';

interface CardFrameProps {
  card: Card;
  unit: Unit | undefined;
  position: number; // 1-based
  total: number;
  children: ReactNode;
}

export function CardFrame({ card, unit, position, total, children }: CardFrameProps) {
  const isTrap = card.tags.includes('trap');
  const isMssql = card.tags.includes('mssql');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-slate-700 dark:text-slate-200">
            {unit?.title ?? card.unitId}
          </span>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
            {CARD_TYPE_LABEL[card.type]}
          </span>
          {isTrap && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
              ⚠️ 함정
            </span>
          )}
          {isMssql && (
            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">
              SQL Server
            </span>
          )}
        </div>
        <span className="shrink-0 tabular-nums">
          {position}/{total}
        </span>
      </div>
      <div className="flex items-center justify-end px-2">
        <CardNoteActions cardId={card.id} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  );
}
