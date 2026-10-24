import type { Box, LeitnerState, ReviewResult } from './types';
import { addDays, isAfter } from './date';

// PRD 6절 박스 이동표를 그대로 옮긴 조회 테이블. Box 0(미학습)도 포함해
// "처음 본 카드를 맞히면 Box 2"를 같은 규칙으로 표현한다.
const TRANSITIONS: Record<Box, Record<ReviewResult, Box>> = {
  0: { good: 2, hard: 1, again: 1 },
  1: { good: 2, hard: 1, again: 1 },
  2: { good: 3, hard: 2, again: 1 },
  3: { good: 4, hard: 2, again: 1 },
  4: { good: 5, hard: 3, again: 1 },
  5: { good: 5, hard: 3, again: 1 },
};

// 다음 복습 간격(일) — 전이 "후" 박스 기준. Box 0은 전이 결과로 나올 수
// 없으므로 간격 테이블에 없다.
const INTERVAL_DAYS: Record<Exclude<Box, 0>, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 7,
};

export function nextBox(box: Box, result: ReviewResult): Box {
  return TRANSITIONS[box][result];
}

/**
 * 평가 1건을 반영한 다음 상태를 계산하는 순수 함수.
 * - 다음 복습일이 시험일을 넘으면 시험일 전날로 당긴다(PRD 6절).
 * - correctStreak는 '맞힘'일 때만 누적되고, 그 외에는 0으로 리셋된다.
 * - lapseCount는 '틀림'일 때만 증가한다.
 */
export function nextState(
  state: LeitnerState,
  result: ReviewResult,
  today: string,
  examDate: string,
): LeitnerState {
  const box = nextBox(state.box, result);
  const rawDueDate = addDays(today, INTERVAL_DAYS[box as Exclude<Box, 0>]);
  const examEve = addDays(examDate, -1);
  const dueDate = isAfter(rawDueDate, examDate) ? examEve : rawDueDate;

  return {
    ...state,
    box,
    dueDate,
    lastReviewedAt: today,
    correctStreak: result === 'good' ? state.correctStreak + 1 : 0,
    lapseCount: result === 'again' ? state.lapseCount + 1 : state.lapseCount,
  };
}
