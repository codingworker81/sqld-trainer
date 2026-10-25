import { useState } from 'react';
import type { Card } from '../../../content/schema';
import type { ReviewResult } from '../../../engine/types';
import { MarkdownContent } from './MarkdownContent';

interface OxCardProps {
  card: Extract<Card, { type: 'ox' }>;
  graded: boolean;
  onGrade: (result: ReviewResult) => void;
  onNext: () => void;
}

/** ox: O/X 선택 → 자동 채점(정답 good, 오답 again) → 해설 → 다음. */
export function OxCard({ card, graded, onGrade, onNext }: OxCardProps) {
  const [selected, setSelected] = useState<'O' | 'X' | null>(null);

  const handleSelect = (choice: 'O' | 'X') => {
    if (graded) return;
    setSelected(choice);
    onGrade(choice === card.answer ? 'good' : 'again');
  };

  const isCorrect = selected === card.answer;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <MarkdownContent>{card.front}</MarkdownContent>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {(['O', 'X'] as const).map((choice) => {
            const isSelected = selected === choice;
            const showCorrectness = graded && isSelected;
            return (
              <button
                key={choice}
                type="button"
                disabled={graded}
                onClick={() => handleSelect(choice)}
                className={`min-h-16 rounded-lg border-2 text-2xl font-bold transition-colors ${
                  showCorrectness
                    ? isCorrect
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {graded && (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <p className={`text-sm font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCorrect ? '정답입니다' : `오답입니다 (정답: ${card.answer})`}
            </p>
            {card.explanation && (
              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <MarkdownContent>{card.explanation}</MarkdownContent>
              </div>
            )}
          </div>
        )}
      </div>

      {graded && (
        <button
          type="button"
          onClick={onNext}
          className="mt-4 min-h-11 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          다음 (Enter)
        </button>
      )}
    </div>
  );
}
