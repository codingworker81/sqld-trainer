import { describe, it, expect } from 'vitest';
import { nextState, nextBox } from './leitner';
import type { Box, LeitnerState, ReviewResult } from './types';

const EXAM_DATE = '2026-11-14';

function state(box: Box, overrides: Partial<LeitnerState> = {}): LeitnerState {
  return {
    cardId: 'u01-test-001',
    box,
    dueDate: '2026-10-20',
    lastReviewedAt: '2026-10-20',
    correctStreak: 0,
    lapseCount: 0,
    ...overrides,
  };
}

// PRD 6절 박스 이동표 전 조합 (Box 0~5 × 맞힘/헷갈림/틀림 = 18개)
const EXPECTED_TRANSITIONS: Record<Box, Record<ReviewResult, Box>> = {
  0: { good: 2, hard: 1, again: 1 },
  1: { good: 2, hard: 1, again: 1 },
  2: { good: 3, hard: 2, again: 1 },
  3: { good: 4, hard: 2, again: 1 },
  4: { good: 5, hard: 3, again: 1 },
  5: { good: 5, hard: 3, again: 1 },
};

describe('nextBox - PRD 6절 박스 이동표 18개 조합', () => {
  for (const [boxStr, results] of Object.entries(EXPECTED_TRANSITIONS)) {
    const box = Number(boxStr) as Box;
    for (const [result, expectedBox] of Object.entries(results) as [ReviewResult, Box][]) {
      it(`Box ${box} + ${result} → Box ${expectedBox}`, () => {
        expect(nextBox(box, result)).toBe(expectedBox);
      });
    }
  }
});

describe('nextState - 간격 계산', () => {
  it('Box 1(1일), Box 2(1일), Box 3(2일), Box 4(4일), Box 5(7일) 간격을 적용한다', () => {
    const today = '2026-10-01';
    expect(nextState(state(0), 'hard', today, EXAM_DATE).dueDate).toBe('2026-10-02'); // ->Box1, +1
    expect(nextState(state(1), 'good', today, EXAM_DATE).dueDate).toBe('2026-10-02'); // ->Box2, +1
    expect(nextState(state(2), 'good', today, EXAM_DATE).dueDate).toBe('2026-10-03'); // ->Box3, +2
    expect(nextState(state(3), 'good', today, EXAM_DATE).dueDate).toBe('2026-10-05'); // ->Box4, +4
    expect(nextState(state(4), 'good', today, EXAM_DATE).dueDate).toBe('2026-10-08'); // ->Box5, +7
  });

  it('처음 본 카드를 맞히면 Box 2로 시작한다', () => {
    const result = nextState(state(0), 'good', '2026-10-01', EXAM_DATE);
    expect(result.box).toBe(2);
  });

  it('11/12에 Box 5 카드를 맞히면 다음 복습일이 11/13로 계산된다 (시험일 상한)', () => {
    const result = nextState(state(5), 'good', '2026-11-12', EXAM_DATE);
    expect(result.box).toBe(5);
    expect(result.dueDate).toBe('2026-11-13');
  });

  it('시험일을 넘지 않으면 그대로 둔다', () => {
    const result = nextState(state(3), 'good', '2026-11-01', EXAM_DATE); // ->Box4, +4 = 11/05
    expect(result.dueDate).toBe('2026-11-05');
  });
});

describe('nextState - correctStreak / lapseCount', () => {
  it('맞힘이면 correctStreak가 증가한다', () => {
    const result = nextState(state(2, { correctStreak: 1 }), 'good', '2026-10-01', EXAM_DATE);
    expect(result.correctStreak).toBe(2);
  });

  it('헷갈림·틀림이면 correctStreak가 0으로 리셋된다', () => {
    expect(nextState(state(2, { correctStreak: 2 }), 'hard', '2026-10-01', EXAM_DATE).correctStreak).toBe(0);
    expect(nextState(state(2, { correctStreak: 2 }), 'again', '2026-10-01', EXAM_DATE).correctStreak).toBe(0);
  });

  it('틀림이면 lapseCount가 증가하고, 그 외에는 유지된다', () => {
    expect(nextState(state(3, { lapseCount: 1 }), 'again', '2026-10-01', EXAM_DATE).lapseCount).toBe(2);
    expect(nextState(state(3, { lapseCount: 1 }), 'good', '2026-10-01', EXAM_DATE).lapseCount).toBe(1);
    expect(nextState(state(3, { lapseCount: 1 }), 'hard', '2026-10-01', EXAM_DATE).lapseCount).toBe(1);
  });
});
