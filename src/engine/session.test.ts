import { describe, it, expect } from 'vitest';
import { buildDailySession, buildUnitSession, chunkBySessionSize, requeueAgain } from './session';
import type { Card, Unit } from '../content/schema';
import type { LeitnerState, SessionSettings } from './types';

function card(id: string, unitId: string): Card {
  return { id, unitId, type: 'definition', front: 'f', back: 'b', tags: [], verified: true } as Card;
}

function unit(id: string, weight: Unit['weight']): Unit {
  return { id, no: Number(id.slice(1)), title: id, weight, expectedCardCount: 10, summaryFile: `${id}.md` };
}

function leitner(cardId: string, box: LeitnerState['box'], dueDate: string): LeitnerState {
  return { cardId, box, dueDate, lastReviewedAt: dueDate, correctStreak: 0, lapseCount: 0 };
}

const SETTINGS: SessionSettings = { newCardLimit: 40, sessionSize: 30, examDate: '2026-11-14' };

describe('buildDailySession - 신규 카드 수 공식', () => {
  it('ceil(미학습 카드 수 / 11/8까지 남은 학습일)만큼 신규 카드를 고른다', () => {
    // today=11/6 -> 11/8까지 남은 학습일 = 11/8-11/6+1 = 3일
    // 미학습 10장 -> ceil(10/3) = 4장
    const units = [unit('u01', 'high')];
    const cards = Array.from({ length: 10 }, (_, i) => card(`u01-x-${i}`, 'u01'));
    const result = buildDailySession(cards, {}, units, SETTINGS, '2026-11-06');
    expect(result).toHaveLength(4);
  });

  it('newCardLimit을 넘지 않는다', () => {
    const units = [unit('u01', 'high')];
    const cards = Array.from({ length: 100 }, (_, i) => card(`u01-x-${i}`, 'u01'));
    const tightSettings: SessionSettings = { ...SETTINGS, newCardLimit: 5 };
    // today=11/7 -> 남은 학습일 2일 -> ceil(100/2)=50, newCardLimit=5로 cap
    const result = buildDailySession(cards, {}, units, tightSettings, '2026-11-07');
    expect(result).toHaveLength(5);
  });

  it('남은 학습일이 0 이하로 떨어지면 1로 보정한다', () => {
    // today가 마감일(11/8) 이후라도 에러 없이 최소 1일로 계산한다
    const units = [unit('u01', 'high')];
    const cards = [card('u01-x-0', 'u01'), card('u01-x-1', 'u01')];
    const result = buildDailySession(cards, {}, units, SETTINGS, '2026-11-20');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('buildDailySession - 신규 카드 순서', () => {
  // 11/8 당일로 두면 남은 학습일이 1일이라 newCount가 전체 카드 수만큼
  // 나와(ceil(3/1)=3) 순서 테스트에 카드 3장이 모두 포함된다.
  const deadline = '2026-11-08';

  it('선택 단원 우선, 그다음 출제 비중 high -> mid -> low 순이다', () => {
    const units = [unit('u01', 'low'), unit('u02', 'high'), unit('u03', 'mid')];
    const cards = [card('u01-a-1', 'u01'), card('u02-a-1', 'u02'), card('u03-a-1', 'u03')];
    const settings: SessionSettings = { ...SETTINGS, newCardLimit: 3 };
    const result = buildDailySession(cards, {}, units, settings, deadline, 'u01');
    expect(result.map((c) => c.unitId)).toEqual(['u01', 'u02', 'u03']);
  });

  it('선택 단원이 없으면 비중 순서만 따른다', () => {
    const units = [unit('u01', 'low'), unit('u02', 'high'), unit('u03', 'mid')];
    const cards = [card('u01-a-1', 'u01'), card('u02-a-1', 'u02'), card('u03-a-1', 'u03')];
    const settings: SessionSettings = { ...SETTINGS, newCardLimit: 3 };
    const result = buildDailySession(cards, {}, units, settings, deadline);
    expect(result.map((c) => c.unitId)).toEqual(['u02', 'u03', 'u01']);
  });
});

describe('buildDailySession - 복습:신규 2:1 혼합', () => {
  it('복습 카드 2장마다 신규 카드 1장을 섞는다', () => {
    const units = [unit('u01', 'high')];
    const reviewCards = [card('r1', 'u01'), card('r2', 'u01'), card('r3', 'u01'), card('r4', 'u01')];
    const newCards = [card('n1', 'u01'), card('n2', 'u01')];
    const states: Record<string, LeitnerState> = {
      r1: leitner('r1', 2, '2026-10-01'),
      r2: leitner('r2', 2, '2026-10-01'),
      r3: leitner('r3', 2, '2026-10-01'),
      r4: leitner('r4', 2, '2026-10-01'),
    };
    const settings: SessionSettings = { ...SETTINGS, newCardLimit: 2 };
    // 11/8 당일 = 남은 학습일 1일 -> ceil(2/1)=2 -> newCardLimit(2)과 같아 2장 모두 선택됨
    const result = buildDailySession([...reviewCards, ...newCards], states, units, settings, '2026-11-08');
    expect(result.map((c) => c.id)).toEqual(['r1', 'r2', 'n1', 'r3', 'r4', 'n2']);
  });
});

describe('buildDailySession - 복습 카드 정렬', () => {
  it('밀린 일수 내림차순, Box 오름차순으로 정렬한다', () => {
    const units = [unit('u01', 'high')];
    const cards = [card('a', 'u01'), card('b', 'u01'), card('c', 'u01')];
    const today = '2026-10-10';
    const states: Record<string, LeitnerState> = {
      a: leitner('a', 2, '2026-10-05'), // 5일 밀림, box2
      b: leitner('b', 1, '2026-10-08'), // 2일 밀림, box1
      c: leitner('c', 4, '2026-10-05'), // 5일 밀림, box4
    };
    const result = buildDailySession(cards, states, units, { ...SETTINGS, newCardLimit: 0 }, today);
    // a,c 모두 5일 밀렸지만 box 오름차순이라 a(2)가 c(4)보다 먼저; b는 덜 밀려서 마지막
    expect(result.map((c) => c.id)).toEqual(['a', 'c', 'b']);
  });

  it('dueDate가 아직 안 된 카드는 포함하지 않는다', () => {
    const units = [unit('u01', 'high')];
    const cards = [card('a', 'u01')];
    const states: Record<string, LeitnerState> = { a: leitner('a', 2, '2026-10-20') };
    const result = buildDailySession(cards, states, units, { ...SETTINGS, newCardLimit: 0 }, '2026-10-10');
    expect(result).toHaveLength(0);
  });
});

describe('buildUnitSession', () => {
  it('해당 단원의 복습 카드 + 미학습 카드 전체를 2:1로 섞는다(신규 카드 상한 미적용)', () => {
    const cards = [
      card('u01-r1', 'u01'),
      card('u01-r2', 'u01'),
      card('u01-n1', 'u01'),
      card('u01-n2', 'u01'),
      card('u01-n3', 'u01'),
      card('u02-other', 'u02'), // 다른 단원은 포함되지 않아야 함
    ];
    const states: Record<string, LeitnerState> = {
      'u01-r1': leitner('u01-r1', 2, '2026-10-01'),
      'u01-r2': leitner('u01-r2', 2, '2026-10-01'),
    };
    const result = buildUnitSession(cards, states, 'u01', '2026-10-10');
    expect(result.map((c) => c.id)).toEqual(['u01-r1', 'u01-r2', 'u01-n1', 'u01-n2', 'u01-n3']);
  });

  it('아직 복습일이 안 된 카드는 제외한다', () => {
    const cards = [card('u01-r1', 'u01')];
    const states: Record<string, LeitnerState> = { 'u01-r1': leitner('u01-r1', 2, '2026-10-20') };
    const result = buildUnitSession(cards, states, 'u01', '2026-10-10');
    expect(result).toHaveLength(0);
  });
});

describe('chunkBySessionSize', () => {
  it('sessionSize 단위로 나눈다', () => {
    const items = Array.from({ length: 7 }, (_, i) => i);
    expect(chunkBySessionSize(items, 3)).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
  });

  it('빈 배열은 빈 청크 하나를 반환한다', () => {
    expect(chunkBySessionSize([], 5)).toEqual([[]]);
  });
});

describe('requeueAgain - 위치', () => {
  it('현재 위치로부터 3~5장 뒤에 넣는다', () => {
    const queue = Array.from({ length: 20 }, (_, i) => i);
    const withMin = requeueAgain(queue, 0, 999, () => 0); // offset 3
    expect(withMin.indexOf(999)).toBe(4); // currentIndex(0)+1+3

    const withMax = requeueAgain(queue, 0, 999, () => 0.999); // offset 5
    expect(withMax.indexOf(999)).toBe(6); // currentIndex(0)+1+5
  });

  it('큐 끝을 넘어가면 맨 끝에 넣는다', () => {
    const queue = [0, 1, 2];
    const result = requeueAgain(queue, 1, 999, () => 0.999); // 1+1+5=7 > length(3)
    expect(result).toEqual([0, 1, 2, 999]);
  });
});
