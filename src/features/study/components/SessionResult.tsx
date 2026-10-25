interface SessionResultProps {
  total: number;
  correctCount: number;
  boxUpCount: number;
  hasMore: boolean;
  onContinue: () => void;
  onGoHome: () => void;
}

export function SessionResult({
  total,
  correctCount,
  boxUpCount,
  hasMore,
  onContinue,
  onGoHome,
}: SessionResultProps) {
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-xl font-bold">세션 결과</h1>
      <div className="grid w-full max-w-xs grid-cols-1 gap-3">
        <Stat label="학습 수" value={`${total}장`} />
        <Stat label="정답률" value={`${accuracy}%`} />
        <Stat label="Box 상승 카드 수" value={`${boxUpCount}장`} />
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        {hasMore && (
          <button
            type="button"
            onClick={onContinue}
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            계속하기
          </button>
        )}
        <button
          type="button"
          onClick={onGoHome}
          className="min-h-11 rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
