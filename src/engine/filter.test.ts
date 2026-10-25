import { describe, it, expect } from 'vitest';
import { filterCards, isEmptyFilter } from './filter';
import type { Card } from '../content/schema';
import type { LeitnerState } from './types';

function card(id: string, unitId: string, type: Card['type'], tags: Card['tags']): Card {
  return { id, unitId, type, front: 'f', back: 'b', tags, verified: true } as Card;
}

function leitner(cardId: string, box: LeitnerState['box']): LeitnerState {
  return { cardId, box, dueDate: '2026-10-25', lastReviewedAt: '2026-10-25', correctStreak: 0, lapseCount: 0 };
}

describe('filterCards', () => {
  const cards = [
    card('u01-a-001', 'u01', 'ox', ['trap']),
    card('u01-b-002', 'u01', 'choice', []),
    card('u02-a-001', 'u02', 'predict', ['mssql']),
    card('u03-a-001', 'u03', 'ox', ['trap', 'mssql']),
  ];
  const states: Record<string, LeitnerState> = {
    'u01-a-001': leitner('u01-a-001', 1),
    'u01-b-002': leitner('u01-b-002', 3),
    'u02-a-001': leitner('u02-a-001', 5),
    // u03-a-001은 리뷰 기록 없음 -> box 0으로 취급
  };

  it('필터가 비어 있으면 전체를 반환한다', () => {
    expect(filterCards(cards, states, {})).toHaveLength(4);
  });

  it('tags는 여러 값 중 하나라도 있으면 통과(OR)시킨다', () => {
    const result = filterCards(cards, states, { tags: ['trap', 'mssql'] });
    expect(result.map((c) => c.id).sort()).toEqual(['u01-a-001', 'u02-a-001', 'u03-a-001']);
  });

  it('types는 선택한 유형만 통과시킨다', () => {
    const result = filterCards(cards, states, { types: ['ox'] });
    expect(result.map((c) => c.id).sort()).toEqual(['u01-a-001', 'u03-a-001']);
  });

  it('unitIds는 선택한 단원만 통과시킨다', () => {
    const result = filterCards(cards, states, { unitIds: ['u02', 'u03'] });
    expect(result.map((c) => c.id).sort()).toEqual(['u02-a-001', 'u03-a-001']);
  });

  it('box 구간은 리뷰 기록이 없으면 0으로 보고 범위를 검사한다', () => {
    const result = filterCards(cards, states, { boxMin: 0, boxMax: 1 });
    expect(result.map((c) => c.id).sort()).toEqual(['u01-a-001', 'u03-a-001']);
  });

  it('여러 필드를 함께 쓰면 AND로 결합된다(trap + Box 1~2)', () => {
    const result = filterCards(cards, states, { tags: ['trap'], boxMin: 1, boxMax: 2 });
    expect(result.map((c) => c.id)).toEqual(['u01-a-001']);
  });

  it('조건에 맞는 카드가 없으면 빈 배열을 반환한다', () => {
    const result = filterCards(cards, states, { tags: ['trap'], unitIds: ['u02'] });
    expect(result).toHaveLength(0);
  });
});

describe('isEmptyFilter', () => {
  it('아무 조건도 없으면 true다', () => {
    expect(isEmptyFilter({})).toBe(true);
  });

  it('하나라도 조건이 있으면 false다', () => {
    expect(isEmptyFilter({ tags: ['trap'] })).toBe(false);
    expect(isEmptyFilter({ boxMin: 1 })).toBe(false);
    expect(isEmptyFilter({ unitIds: [] })).toBe(true); // 빈 배열은 조건 없음과 동일
  });
});
