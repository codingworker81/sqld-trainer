import type { Card, CardType } from '../content/schema';
import type { Box, LeitnerState } from './types';

/** F-10 필터 학습 조건. 각 필드는 비어 있으면("undefined" 또는 빈 배열)
 * 그 기준으로는 거르지 않는다(와일드카드). 여러 필드를 함께 쓰면 AND로
 * 결합되고, 같은 필드 안에서 여러 값을 고르면 OR로 결합된다. */
export interface CardFilter {
  tags?: Card['tags'][number][];
  types?: CardType[];
  unitIds?: string[];
  boxMin?: Box;
  boxMax?: Box;
}

/** 카드 1장이 필터 조건을 만족하는지 검사한다. Box는 리뷰 기록이 없으면
 * 0(미학습)으로 본다. */
export function filterCards(
  cards: Card[],
  states: Record<string, LeitnerState>,
  filter: CardFilter,
): Card[] {
  const hasBoxFilter = filter.boxMin !== undefined || filter.boxMax !== undefined;

  return cards.filter((card) => {
    if (filter.tags && filter.tags.length > 0 && !filter.tags.some((t) => card.tags.includes(t))) {
      return false;
    }
    if (filter.types && filter.types.length > 0 && !filter.types.includes(card.type)) {
      return false;
    }
    if (filter.unitIds && filter.unitIds.length > 0 && !filter.unitIds.includes(card.unitId)) {
      return false;
    }
    if (hasBoxFilter) {
      const box = states[card.id]?.box ?? 0;
      if (filter.boxMin !== undefined && box < filter.boxMin) return false;
      if (filter.boxMax !== undefined && box > filter.boxMax) return false;
    }
    return true;
  });
}

/** 필터가 하나도 선택되지 않은 상태인지(= 전체 카드와 같은지) 확인한다.
 * 필터 학습 화면에서 "조건을 하나도 고르지 않으면 시작 비활성화"에 쓴다. */
export function isEmptyFilter(filter: CardFilter): boolean {
  return (
    (!filter.tags || filter.tags.length === 0) &&
    (!filter.types || filter.types.length === 0) &&
    (!filter.unitIds || filter.unitIds.length === 0) &&
    filter.boxMin === undefined &&
    filter.boxMax === undefined
  );
}
