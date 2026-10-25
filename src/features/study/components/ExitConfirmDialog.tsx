interface ExitConfirmDialogProps {
  onStop: () => void;
  onContinue: () => void;
}

export function ExitConfirmDialog({ onStop, onContinue }: ExitConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 dark:bg-slate-900">
        <p className="text-base font-medium text-slate-800 dark:text-slate-100">
          학습을 그만둘까요? 기록은 저장되어 있습니다
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onContinue}
            className="min-h-11 flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            계속 학습
          </button>
          <button
            type="button"
            onClick={onStop}
            className="min-h-11 flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            그만두기
          </button>
        </div>
      </div>
    </div>
  );
}
