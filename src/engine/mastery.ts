import type { Card } from '../content/schema';
import type { Box, LeitnerState } from './types';
import { addDays } from './date';

export function isMastered(box: Box): boolean {
  return box >= 3;
}

function masteryPercent(cards: Card[], states: Record<string, LeitnerState>): number {
  if (cards.length === 0) return 0;
  const masteredCount = cards.filter((c) => isMastered(states[c.id]?.box ?? 0)).length;
  return (masteredCount / cards.length) * 100;
}

export function unitMastery(cards: Card[], states: Record<string, LeitnerState>, unitId: string): number {
  return masteryPercent(
    cards.filter((c) => c.unitId === unitId),
    states,
  );
}

/** PRD 6절: 전체 숙련도는 단원 숙련도를 카드 수로 가중 평균한 값과 같다
 * (= 전체 숙련 카드 수 ÷ 전체 카드 수). */
export function overallMastery(cards: Card[], states: Record<string, LeitnerState>): number {
  return masteryPercent(cards, states);
}

export function trapMastery(cards: Card[], states: Record<string, LeitnerState>): number {
  return masteryPercent(
    cards.filter((c) => c.tags.includes('trap')),
    states,
  );
}

/**
 * 연속 학습일. reviewDates는 최소 1장이라도 학습한 날짜(YYYY-MM-DD) 목록.
 * 오늘 아직 학습하지 않았다면(세션 시작 전 홈 화면 등) 어제까지의 연속
 * 기록을 보여주고, 오늘 학습이 있으면 오늘부터 거슬러 센다.
 */
export function streakDays(reviewDates: string[], today: string): number {
  const studied = new Set(reviewDates);
  let cursor = studied.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (studied.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
