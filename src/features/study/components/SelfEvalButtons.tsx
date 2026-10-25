import type { ReviewResult } from '../../../engine/types';

const OPTIONS: { result: ReviewResult; label: string; shortcut: string; className: string }[] = [
  {
    result: 'again',
    label: '틀림',
    shortcut: '1',
    className: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  {
    result: 'hard',
    label: '헷갈림',
    shortcut: '2',
    className: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  {
    result: 'good',
    label: '맞힘',
    shortcut: '3',
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
];

export function SelfEvalButtons({ onSelect }: { onSelect: (result: ReviewResult) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.result}
          type="button"
          onClick={() => onSelect(opt.result)}
          className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold ${opt.className}`}
        >
          {opt.label}
          <span className="ml-1 hidden text-xs opacity-70 sm:inline">({opt.shortcut})</span>
        </button>
      ))}
    </div>
  );
}
