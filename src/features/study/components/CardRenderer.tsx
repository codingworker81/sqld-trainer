import type { Card } from '../../../content/schema';
import type { ReviewResult } from '../../../engine/types';
import { FlipCard } from './FlipCard';
import { OxCard } from './OxCard';
import { ChoiceCard } from './ChoiceCard';
import { OrderCard } from './OrderCard';

interface CardRendererProps {
  card: Card;
  flipped: boolean;
  graded: boolean;
  onFlip: () => void;
  onManualEvaluate: (result: ReviewResult) => void;
  onAutoGrade: (result: ReviewResult) => void;
  onNext: () => void;
}

export function CardRenderer({
  card,
  flipped,
  graded,
  onFlip,
  onManualEvaluate,
  onAutoGrade,
  onNext,
}: CardRendererProps) {
  // Set.has()는 TS 판별 유니언을 좁혀주지 않으므로, 리터럴 비교로 분기한다.
  if (card.type === 'definition' || card.type === 'predict' || card.type === 'cloze' || card.type === 'dbms') {
    return <FlipCard card={card} flipped={flipped} onFlip={onFlip} onEvaluate={onManualEvaluate} />;
  }
  if (card.type === 'ox') {
    return <OxCard card={card} graded={graded} onGrade={onAutoGrade} onNext={onNext} />;
  }
  if (card.type === 'choice') {
    return <ChoiceCard card={card} graded={graded} onGrade={onAutoGrade} onNext={onNext} />;
  }
  return <OrderCard card={card} graded={graded} onGrade={onAutoGrade} onNext={onNext} />;
}
