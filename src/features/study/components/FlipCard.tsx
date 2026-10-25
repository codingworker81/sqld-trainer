import type { Card } from '../../../content/schema';
import type { ReviewResult } from '../../../engine/types';
import { MarkdownContent } from './MarkdownContent';
import { SelfEvalButtons } from './SelfEvalButtons';
import { useSwipe } from '../hooks/useSwipe';

interface FlipCardProps {
  card: Extract<Card, { type: 'definition' | 'predict' | 'cloze' | 'dbms' }>;
  flipped: boolean;
  onFlip: () => void;
  onEvaluate: (result: ReviewResult) => void;
}

/** definition/predict/cloze/dbms: 앞면 → 탭/Space로 뒤집기 → 뒷면+해설. */
export function FlipCard({ card, flipped, onFlip, onEvaluate }: FlipCardProps) {
  const swipe = useSwipe({
    enabled: flipped,
    onSwipeLeft: () => onEvaluate('again'),
    onSwipeRight: () => onEvaluate('good'),
  });

  return (
    <div className="flex h-full flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={!flipped ? onFlip : undefined}
        className={`flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 ${!flipped ? 'cursor-pointer' : ''}`}
        {...(flipped ? swipe : {})}
      >
        <MarkdownContent>{card.front}</MarkdownContent>
        {!flipped && (
          <p className="mt-6 text-center text-sm text-slate-400">탭하거나 Space를 눌러 뒤집기</p>
        )}
        {flipped && (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <MarkdownContent>{card.back}</MarkdownContent>
            {card.explanation && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <MarkdownContent>{card.explanation}</MarkdownContent>
              </div>
            )}
          </div>
        )}
      </div>
      {flipped && (
        <div className="mt-4">
          <SelfEvalButtons onSelect={onEvaluate} />
        </div>
      )}
    </div>
  );
}
