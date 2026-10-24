import { describe, it, expect } from 'vitest';
import { isMastered, unitMastery, overallMastery, trapMastery, streakDays } from './mastery';
import type { Card } from '../content/schema';
import type { LeitnerState } from './types';

function card(id: string, unitId: string, tags: Card['tags'] = []): Card {
  return {
    id,
    unitId,
    type: 'definition',
    front: 'f',
    back: 'b',
    tags,
    verified: true,
  } as Card;
}

function leitner(cardId: string, box: LeitnerState['box']): LeitnerState {
  return { cardId, box, dueDate: '2026-10-01', lastReviewedAt: '2026-10-01', correctStreak: 0, lapseCount: 0 };
}

describe('isMastered', () => {
  it('Box 3 이상이면 숙련으로 본다', () => {
    expect(isMastered(0)).toBe(false);
    expect(isMastered(2)).toBe(false);
    expect(isMastered(3)).toBe(true);
    expect(isMastered(5)).toBe(true);
  });
});

describe('unitMastery / overallMastery / trapMastery', () => {
  const cards = [
    card('u01-a-001', 'u01', ['trap']),
    card('u01-a-002', 'u01'),
    card('u02-a-001', 'u02', ['trap']),
    card('u02-a-002', 'u02'),
  ];
  const states: Record<string, LeitnerState> = {
    'u01-a-001': leitner('u01-a-001', 3), // mastered, trap
    'u01-a-002': leitner('u01-a-002', 1), // not mastered
    'u02-a-001': leitner('u02-a-001', 4), // mastered, trap
    // u02-a-002: 상태 없음(미학습) -> box 0 취급
  };

  it('단원 숙련도는 해당 단원 카드 중 숙련 비율이다', () => {
    expect(unitMastery(cards, states, 'u01')).toBe(50); // 1/2
    expect(unitMastery(cards, states, 'u02')).toBe(50); // 1/2
  });

  it('카드가 없는 단원은 0을 반환한다', () => {
    expect(unitMastery(cards, states, 'u99')).toBe(0);
  });

  it('전체 숙련도는 전체 카드 중 숙련 비율이다', () => {
    expect(overallMastery(cards, states)).toBe(50); // 2/4
  });

  it('함정 숙련도는 trap 태그 카드만으로 계산한다', () => {
    expect(trapMastery(cards, states)).toBe(100); // trap 2장 모두 숙련(3,4)
  });
});

describe('streakDays', () => {
  it('오늘까지 매일 학습했으면 오늘 포함 연속일을 센다', () => {
    const dates = ['2026-10-20', '2026-10-21', '2026-10-22'];
    expect(streakDays(dates, '2026-10-22')).toBe(3);
  });

  it('오늘 아직 학습 전이어도 어제까지의 연속 기록을 보여준다', () => {
    const dates = ['2026-10-20', '2026-10-21'];
    expect(streakDays(dates, '2026-10-22')).toBe(2);
  });

  it('하루라도 빠지면 그 이전 기록은 끊긴다', () => {
    const dates = ['2026-10-18', '2026-10-20', '2026-10-21'];
    expect(streakDays(dates, '2026-10-21')).toBe(2);
  });

  it('학습 기록이 없으면 0이다', () => {
    expect(streakDays([], '2026-10-21')).toBe(0);
  });
});
