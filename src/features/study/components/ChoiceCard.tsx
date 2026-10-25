import { useState } from 'react';
import type { Card } from '../../../content/schema';
import type { ReviewResult } from '../../../engine/types';
import { MarkdownContent } from '../../../components/content/MarkdownContent';

interface ChoiceCardProps {
  card: Extract<Card, { type: 'choice' }>;
  graded: boolean;
  onGrade: (result: ReviewResult) => void;
  onNext: () => void;
}

/** choice: 보기 4개 중 선택 → 자동 채점 → 해설 → 다음. */
export function ChoiceCard({ card, graded, onGrade, onNext }: ChoiceCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (graded) return;
    setSelectedIndex(index);
    const selectedAnswer = String(index + 1);
    onGrade(selectedAnswer === card.answer ? 'good' : 'again');
  };

  const answerIndex = Number(card.answer) - 1;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <MarkdownContent>{card.front}</MarkdownContent>

        <div className="mt-4 flex flex-col gap-2">
          {card.choices.map((choice, index) => {
            const isSelected = selectedIndex === index;
            const isAnswer = graded && index === answerIndex;
            const isWrongPick = graded && isSelected && index !== answerIndex;
            return (
              <button
                key={index}
                type="button"
                disabled={graded}
                onClick={() => handleSelect(index)}
                className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm ${
                  isAnswer
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : isWrongPick
                      ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span className="mr-2 font-semibold">{index + 1}.</span>
                {choice}
              </button>
            );
          })}
        </div>

        {graded && card.explanation && (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <MarkdownContent>{card.explanation}</MarkdownContent>
            </div>
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
