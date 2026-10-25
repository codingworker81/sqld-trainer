import { useState } from 'react';

interface NoteSheetProps {
  title: string;
  placeholder: string;
  initialValue: string;
  confirmLabel: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

/** 메모·오류 신고 입력용 바텀시트(모바일)/모달(PC). 뷰포트 너비로만
 * 구분한다(640px 미만: 하단 시트, 이상: 중앙 모달). */
export function NoteSheet({ title, placeholder, initialValue, confirmLabel, onSave, onClose }: NoteSheetProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom w-full rounded-t-2xl bg-white p-4 dark:bg-slate-900 sm:w-full sm:max-w-md sm:rounded-2xl"
      >
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={4}
          autoFocus
          className="mt-3 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onSave(value)}
            className="min-h-11 flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
