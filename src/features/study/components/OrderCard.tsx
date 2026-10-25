import { useState } from 'react';
import type { Card } from '../../../content/schema';
import type { ReviewResult } from '../../../engine/types';
import { MarkdownContent } from './MarkdownContent';

interface OrderCardProps {
  card: Extract<Card, { type: 'order' }>;
  graded: boolean;
  onGrade: (result: ReviewResult) => void;
  onNext: () => void;
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** order: 항목을 탭한 순서대로 배열 → 전부 놓으면 자동 채점 → 해설 → 다음. */
export function OrderCard({ card, graded, onGrade, onNext }: OrderCardProps) {
  const [placed, setPlaced] = useState<number[]>([]); // card.items의 원래 인덱스들

  const isComplete = placed.length === card.items.length;
  const isCorrect = isComplete && arraysEqual(placed, card.answer);

  const place = (index: number) => {
    if (graded || placed.includes(index)) return;
    const next = [...placed, index];
    setPlaced(next);
    if (next.length === card.items.length) {
      onGrade(arraysEqual(next, card.answer) ? 'good' : 'again');
    }
  };

  const unplace = (index: number) => {
    if (graded) return;
    setPlaced((prev) => prev.filter((i) => i !== index));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <MarkdownContent>{card.front}</MarkdownContent>

        <div className="mt-4">
          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">배치한 순서 (탭해서 되돌리기)</p>
          <div className="flex min-h-11 flex-wrap gap-2 rounded-lg border border-dashed border-slate-300 p-2 dark:border-slate-600">
            {placed.map((index, order) => (
              <button
                key={index}
                type="button"
                disabled={graded}
                onClick={() => unplace(index)}
                className="min-h-11 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                {order + 1}. {card.items[index]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">남은 항목</p>
          <div className="flex flex-wrap gap-2">
            {card.items.map((item, index) =>
              placed.includes(index) ? null : (
                <button
                  key={index}
                  type="button"
                  disabled={graded}
                  onClick={() => place(index)}
                  className="min-h-11 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>

        {graded && (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <p className={`text-sm font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCorrect
                ? '정답입니다'
                : `오답입니다 (정답: ${card.answer.map((i) => card.items[i]).join(' → ')})`}
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
