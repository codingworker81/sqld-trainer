import { useEffect, useState } from 'react';
import { getNote, getState, saveNote, setManualWrongNote, toggleBookmark, type CardNote } from '../../../db';
import { todayInSeoul } from '../../../engine/date';
import { NoteSheet } from './NoteSheet';

type Sheet = 'memo' | 'error' | null;

const EMPTY_NOTE: CardNote = { cardId: '', bookmarked: false, memo: '', errorReport: '', errorReportedAt: '' };

/** 학습 화면 카드별 북마크·오답노트 수동 추가·메모·오류 신고(F-13, F-07 수동
 * 추가/해제). 카드가 바뀔 때마다 그 카드의 저장된 노트/오답노트 상태를
 * 새로 불러온다. */
export function CardNoteActions({ cardId }: { cardId: string }) {
  const [note, setNote] = useState<CardNote>(EMPTY_NOTE);
  const [manualWrongNote, setManualWrongNoteState] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getNote(cardId), getState(cardId)]).then(([n, state]) => {
      if (cancelled) return;
      setNote(n);
      setManualWrongNoteState(state?.manualWrongNote ?? false);
    });
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  async function handleToggleBookmark() {
    const next = await toggleBookmark(cardId);
    setNote(next);
  }

  async function handleToggleWrongNote() {
    const next = !manualWrongNote;
    await setManualWrongNote(cardId, next, todayInSeoul());
    setManualWrongNoteState(next);
  }

  async function handleSaveMemo(value: string) {
    const next = await saveNote(cardId, { memo: value });
    setNote(next);
    setSheet(null);
  }

  async function handleSaveErrorReport(value: string) {
    const next = await saveNote(cardId, {
      errorReport: value,
      errorReportedAt: value.trim() === '' ? '' : todayInSeoul(),
    });
    setNote(next);
    setSheet(null);
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          active={note.bookmarked}
          label={note.bookmarked ? '북마크 해제' : '북마크'}
          onClick={() => void handleToggleBookmark()}
        >
          {note.bookmarked ? '⭐' : '☆'}
        </IconButton>
        <IconButton
          active={manualWrongNote}
          label={manualWrongNote ? '오답노트에서 수동 제거' : '오답노트에 수동 추가'}
          onClick={() => void handleToggleWrongNote()}
        >
          📌
        </IconButton>
        <IconButton active={note.memo.length > 0} label="메모" onClick={() => setSheet('memo')}>
          📝
        </IconButton>
        <IconButton active={note.errorReport.length > 0} label="오류 신고" onClick={() => setSheet('error')}>
          🚩
        </IconButton>
      </div>

      {sheet === 'memo' && (
        <NoteSheet
          title="메모"
          placeholder="이 카드에 대한 메모를 남겨보세요."
          initialValue={note.memo}
          confirmLabel="저장"
          onSave={(v) => void handleSaveMemo(v)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'error' && (
        <NoteSheet
          title="오류 신고"
          placeholder="카드 내용에 오류가 있다면 설명해주세요(콘텐츠 수정에 사용됩니다)."
          initialValue={note.errorReport}
          confirmLabel="신고"
          onSave={(v) => void handleSaveErrorReport(v)}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

function IconButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-lg ${
        active ? 'bg-blue-100 dark:bg-blue-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}
